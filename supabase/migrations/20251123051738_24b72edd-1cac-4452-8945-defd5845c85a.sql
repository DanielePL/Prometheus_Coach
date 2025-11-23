-- Allow clients to view routines that are assigned to them
CREATE POLICY "Clients can view assigned routines"
ON public.routines
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM routine_assignments
    WHERE routine_assignments.routine_id = routines.id
      AND routine_assignments.client_id = auth.uid()
      AND routine_assignments.status = 'active'
  )
);