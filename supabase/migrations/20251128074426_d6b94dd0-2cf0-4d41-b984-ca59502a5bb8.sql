-- Add secondary_muscles column to exercises table
ALTER TABLE public.exercises 
ADD COLUMN secondary_muscles text NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.exercises.secondary_muscles IS 'Comma-separated list of secondary/stabilizer muscle groups targeted by this exercise';