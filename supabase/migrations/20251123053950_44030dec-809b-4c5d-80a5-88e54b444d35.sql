-- Allow clients to view routine exercises for their assigned routines
CREATE POLICY "Clients can view exercises in assigned routines"
ON public.routine_exercises
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM routine_assignments
    WHERE routine_assignments.routine_id = routine_exercises.routine_id
      AND routine_assignments.client_id = auth.uid()
      AND routine_assignments.status = 'active'
  )
);