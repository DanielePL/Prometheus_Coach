-- Create personal_records table for tracking client PRs
CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  weight_used NUMERIC NOT NULL CHECK (weight_used > 0),
  reps_completed INTEGER NOT NULL CHECK (reps_completed > 0),
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own PRs"
  ON public.personal_records
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert their own PRs"
  ON public.personal_records
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Coaches can view their clients' PRs"
  ON public.personal_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_client_connections
      WHERE coach_id = auth.uid()
        AND client_id = personal_records.client_id
        AND status = 'accepted'
    )
  );

-- Indexes for performance
CREATE INDEX idx_personal_records_client_id ON public.personal_records(client_id);
CREATE INDEX idx_personal_records_exercise_id ON public.personal_records(exercise_id);
CREATE INDEX idx_personal_records_client_exercise ON public.personal_records(client_id, exercise_id);

-- Unique constraint: one PR per client per exercise (will be updated when beaten)
CREATE UNIQUE INDEX idx_unique_pr_per_client_exercise ON public.personal_records(client_id, exercise_id);