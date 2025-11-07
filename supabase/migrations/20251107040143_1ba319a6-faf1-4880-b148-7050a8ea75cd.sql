-- Add new metadata fields to exercises table
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS primary_muscles text,
ADD COLUMN IF NOT EXISTS equipment text,
ADD COLUMN IF NOT EXISTS suggested_sets integer,
ADD COLUMN IF NOT EXISTS suggested_reps text,
ADD COLUMN IF NOT EXISTS suggested_weight text,
ADD COLUMN IF NOT EXISTS key_aspects text,
ADD COLUMN IF NOT EXISTS common_mistakes text,
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private' CHECK (visibility IN ('public', 'private'));

-- Update RLS policies for exercises

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Only admins can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Only admins can update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Only admins can delete exercises" ON public.exercises;

-- New SELECT policy: Public exercises visible to everyone, private visible to creator and their clients
CREATE POLICY "View public exercises or own exercises"
ON public.exercises
FOR SELECT
USING (
  visibility = 'public' 
  OR created_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- INSERT policy: Coaches and admins can insert
CREATE POLICY "Coaches and admins can insert exercises"
ON public.exercises
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'coach'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- UPDATE policy: Creator or admin can update
CREATE POLICY "Creator or admin can update exercises"
ON public.exercises
FOR UPDATE
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- DELETE policy: Creator or admin can delete
CREATE POLICY "Creator or admin can delete exercises"
ON public.exercises
FOR DELETE
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);