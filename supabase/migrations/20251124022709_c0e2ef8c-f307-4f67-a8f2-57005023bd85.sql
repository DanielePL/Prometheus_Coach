-- Add fields to track paused workout state
ALTER TABLE public.workout_sessions
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_exercise_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS paused_elapsed_seconds INTEGER;

-- Add comment explaining the new fields
COMMENT ON COLUMN public.workout_sessions.paused_at IS 'Timestamp when workout was paused';
COMMENT ON COLUMN public.workout_sessions.current_exercise_index IS 'Index of exercise user was on when paused';
COMMENT ON COLUMN public.workout_sessions.paused_elapsed_seconds IS 'Total elapsed seconds when workout was paused';