-- Create client_workouts table
CREATE TABLE public.client_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  exercises JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workout_logs table
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  workout_id UUID REFERENCES public.client_workouts(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  exercises_completed JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create weight_logs table
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create body_measurements table
CREATE TABLE public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  hips DECIMAL(5,2),
  arms DECIMAL(5,2),
  legs DECIMAL(5,2),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create progress_photos table
CREATE TABLE public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('before', 'after', 'progress')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create coach_notes table
CREATE TABLE public.coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  client_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.client_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_workouts
CREATE POLICY "Coaches can view workouts for their clients"
ON public.client_workouts FOR SELECT
USING (
  coach_id = auth.uid() OR
  (client_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.coach_client_connections
    WHERE client_id = auth.uid() AND coach_id = client_workouts.coach_id AND status = 'accepted'
  ))
);

CREATE POLICY "Coaches can create workouts for their clients"
ON public.client_workouts FOR INSERT
WITH CHECK (
  coach_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.coach_client_connections
    WHERE coach_id = auth.uid() AND client_id = client_workouts.client_id AND status = 'accepted'
  )
);

CREATE POLICY "Coaches can update their own workouts"
ON public.client_workouts FOR UPDATE
USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own workouts"
ON public.client_workouts FOR DELETE
USING (coach_id = auth.uid());

-- RLS Policies for workout_logs
CREATE POLICY "Users can view their own workout logs"
ON public.workout_logs FOR SELECT
USING (
  client_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.coach_client_connections
    WHERE coach_id = auth.uid() AND client_id = workout_logs.client_id AND status = 'accepted'
  )
);

CREATE POLICY "Clients can create their own workout logs"
ON public.workout_logs FOR INSERT
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their own workout logs"
ON public.workout_logs FOR UPDATE
USING (client_id = auth.uid());

-- RLS Policies for weight_logs
CREATE POLICY "Users can view weight logs"
ON public.weight_logs FOR SELECT
USING (
  client_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.coach_client_connections
    WHERE coach_id = auth.uid() AND client_id = weight_logs.client_id AND status = 'accepted'
  )
);

CREATE POLICY "Clients can manage their own weight logs"
ON public.weight_logs FOR ALL
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- RLS Policies for body_measurements
CREATE POLICY "Users can view body measurements"
ON public.body_measurements FOR SELECT
USING (
  client_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.coach_client_connections
    WHERE coach_id = auth.uid() AND client_id = body_measurements.client_id AND status = 'accepted'
  )
);

CREATE POLICY "Clients can manage their own measurements"
ON public.body_measurements FOR ALL
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- RLS Policies for progress_photos
CREATE POLICY "Users can view progress photos"
ON public.progress_photos FOR SELECT
USING (
  client_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.coach_client_connections
    WHERE coach_id = auth.uid() AND client_id = progress_photos.client_id AND status = 'accepted'
  )
);

CREATE POLICY "Clients can manage their own photos"
ON public.progress_photos FOR ALL
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- RLS Policies for coach_notes (COACH-ONLY)
CREATE POLICY "Coaches can view notes for their clients"
ON public.coach_notes FOR SELECT
USING (
  coach_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.coach_client_connections
    WHERE coach_id = auth.uid() AND client_id = coach_notes.client_id AND status = 'accepted'
  )
);

CREATE POLICY "Coaches can create notes for their clients"
ON public.coach_notes FOR INSERT
WITH CHECK (
  coach_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.coach_client_connections
    WHERE coach_id = auth.uid() AND client_id = coach_notes.client_id AND status = 'accepted'
  )
);

CREATE POLICY "Coaches can update their own notes"
ON public.coach_notes FOR UPDATE
USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own notes"
ON public.coach_notes FOR DELETE
USING (coach_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_client_workouts_client ON public.client_workouts(client_id);
CREATE INDEX idx_client_workouts_coach ON public.client_workouts(coach_id);
CREATE INDEX idx_workout_logs_client ON public.workout_logs(client_id);
CREATE INDEX idx_weight_logs_client ON public.weight_logs(client_id);
CREATE INDEX idx_body_measurements_client ON public.body_measurements(client_id);
CREATE INDEX idx_progress_photos_client ON public.progress_photos(client_id);
CREATE INDEX idx_coach_notes_client ON public.coach_notes(client_id);

-- Create triggers for updated_at
CREATE TRIGGER update_client_workouts_updated_at
BEFORE UPDATE ON public.client_workouts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_coach_notes_updated_at
BEFORE UPDATE ON public.coach_notes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();