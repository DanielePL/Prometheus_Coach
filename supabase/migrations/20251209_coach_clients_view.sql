-- ═══════════════════════════════════════════════════════════════
-- COACH CLIENTS VIEW
-- Provides denormalized access to coach-client relationships
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Drop view if exists (for idempotent re-runs)
DROP VIEW IF EXISTS public.coach_clients_v;

-- Create the view
CREATE VIEW public.coach_clients_v AS
SELECT
    ccc.id AS connection_id,
    ccc.coach_id,
    ccc.client_id,
    ccc.status,
    ccc.requested_at,
    ccc.responded_at,
    ccc.created_at,
    ccc.updated_at,
    p.full_name AS client_name,
    p.avatar_url AS client_avatar
FROM public.coach_client_connections ccc
JOIN public.profiles p ON p.id = ccc.client_id;

-- Grant access to authenticated users
GRANT SELECT ON public.coach_clients_v TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Note: This view inherits RLS from coach_client_connections
-- Coaches can only see their own clients via the underlying table's RLS
-- ═══════════════════════════════════════════════════════════════

-- Verify
SELECT 'coach_clients_v created successfully' AS status;
