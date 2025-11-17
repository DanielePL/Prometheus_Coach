-- Create routines table
CREATE TABLE public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create routine_exercises table
CREATE TABLE public.routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER DEFAULT 3,
  reps_min INTEGER,
  reps_max INTEGER,
  rest_seconds INTEGER DEFAULT 90,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create routine_assignments table
CREATE TABLE public.routine_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scheduled_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'active'
);

-- Create workout_sessions table
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'in_progress',
  client_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create set_logs table
CREATE TABLE public.set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps_completed INTEGER,
  weight_used DECIMAL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routines
CREATE POLICY "Coaches can create their own routines"
  ON public.routines FOR INSERT
  WITH CHECK (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Coaches can view their own routines"
  ON public.routines FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own routines"
  ON public.routines FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own routines"
  ON public.routines FOR DELETE
  USING (auth.uid() = coach_id);

-- RLS Policies for routine_exercises
CREATE POLICY "Coaches can manage exercises in their routines"
  ON public.routine_exercises FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.routines
    WHERE routines.id = routine_exercises.routine_id
    AND routines.coach_id = auth.uid()
  ));

-- RLS Policies for routine_assignments
CREATE POLICY "Coaches can assign their routines to clients"
  ON public.routine_assignments FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id 
    AND EXISTS (
      SELECT 1 FROM public.routines
      WHERE routines.id = routine_assignments.routine_id
      AND routines.coach_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.coach_client_connections
      WHERE coach_client_connections.coach_id = auth.uid()
      AND coach_client_connections.client_id = routine_assignments.client_id
      AND coach_client_connections.status = 'accepted'
    )
  );

CREATE POLICY "Coaches can view assignments for their routines"
  ON public.routine_assignments FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Clients can view their assignments"
  ON public.routine_assignments FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Coaches can update their assignments"
  ON public.routine_assignments FOR UPDATE
  USING (auth.uid() = coach_id);

-- RLS Policies for workout_sessions
CREATE POLICY "Clients can create their own sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can view their own sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Coaches can view their clients' sessions"
  ON public.workout_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.coach_client_connections
    WHERE coach_client_connections.coach_id = auth.uid()
    AND coach_client_connections.client_id = workout_sessions.client_id
    AND coach_client_connections.status = 'accepted'
  ));

CREATE POLICY "Clients can update their own sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own sessions"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = client_id);

-- RLS Policies for set_logs
CREATE POLICY "Clients can manage their own set logs"
  ON public.set_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions
    WHERE workout_sessions.id = set_logs.session_id
    AND workout_sessions.client_id = auth.uid()
  ));

CREATE POLICY "Coaches can view their clients' set logs"
  ON public.set_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    INNER JOIN public.coach_client_connections ccc 
      ON ccc.client_id = ws.client_id
    WHERE ws.id = set_logs.session_id
    AND ccc.coach_id = auth.uid()
    AND ccc.status = 'accepted'
  ));

-- Add trigger for updated_at on routines
CREATE TRIGGER update_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_routines_coach_id ON public.routines(coach_id);
CREATE INDEX idx_routine_exercises_routine_id ON public.routine_exercises(routine_id);
CREATE INDEX idx_routine_exercises_exercise_id ON public.routine_exercises(exercise_id);
CREATE INDEX idx_routine_assignments_client_id ON public.routine_assignments(client_id);
CREATE INDEX idx_routine_assignments_coach_id ON public.routine_assignments(coach_id);
CREATE INDEX idx_routine_assignments_routine_id ON public.routine_assignments(routine_id);
CREATE INDEX idx_workout_sessions_client_id ON public.workout_sessions(client_id);
CREATE INDEX idx_workout_sessions_routine_id ON public.workout_sessions(routine_id);
CREATE INDEX idx_set_logs_session_id ON public.set_logs(session_id);