-- ═══════════════════════════════════════════════════════════════
-- WORKOUT & STATISTICS - COACH ACCESS POLICIES
-- Compatible with Mobile App's statistics schema
-- ═══════════════════════════════════════════════════════════════

-- ============================================================
-- Note: Mobile App uses relaxed policies (USING true) for dev
-- These policies add coach access on top of existing policies
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. WORKOUT_SESSIONS - Coach Access
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Drop only coach-specific policies (keep mobile app policies)
DROP POLICY IF EXISTS "coaches_view_client_sessions" ON workout_sessions;

-- Coach can view connected clients' sessions (via user_id - Mobile App)
-- This works alongside existing policies
CREATE POLICY "coaches_view_client_sessions" ON workout_sessions
  FOR SELECT USING (
    -- Coach can see their connected clients' sessions (via user_id - Mobile App)
    EXISTS (
      SELECT 1 FROM coach_client_connections
      WHERE coach_id = auth.uid()
      AND client_id = workout_sessions.user_id
      AND status = 'accepted'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 2. WORKOUT_SETS - Coach Access (Mobile App table)
-- Note: Mobile App uses workout_sets, Coach app used set_logs
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_sets') THEN
    ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "coaches_view_client_sets" ON workout_sets;

    CREATE POLICY "coaches_view_client_sets" ON workout_sets
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM workout_sessions ws
          JOIN coach_client_connections ccc ON ccc.client_id = ws.user_id
          WHERE ws.id = workout_sets.session_id
          AND ccc.coach_id = auth.uid()
          AND ccc.status = 'accepted'
        )
      );
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 3. WORKOUT_HISTORY - Coach Access (Mobile App table)
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_history') THEN
    ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;

    -- Drop only coach-specific policy
    DROP POLICY IF EXISTS "coaches_view_client_workout_history" ON workout_history;

    -- Coach access policy
    CREATE POLICY "coaches_view_client_workout_history" ON workout_history
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM coach_client_connections
          WHERE coach_id = auth.uid()
          AND client_id = workout_history.user_id
          AND status = 'accepted'
        )
      );
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 4. USER_TRAINING_SUMMARY - Coach Access (Mobile App table)
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_training_summary') THEN
    ALTER TABLE user_training_summary ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "coaches_view_client_training_summary" ON user_training_summary;

    CREATE POLICY "coaches_view_client_training_summary" ON user_training_summary
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM coach_client_connections
          WHERE coach_id = auth.uid()
          AND client_id = user_training_summary.user_id
          AND status = 'accepted'
        )
      );
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 5. EXERCISE_STATISTICS - Coach Access (Mobile App table)
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_statistics') THEN
    ALTER TABLE exercise_statistics ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "coaches_view_client_exercise_stats" ON exercise_statistics;

    CREATE POLICY "coaches_view_client_exercise_stats" ON exercise_statistics
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM coach_client_connections
          WHERE coach_id = auth.uid()
          AND client_id = exercise_statistics.user_id
          AND status = 'accepted'
        )
      );
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 6. PR_HISTORY - Coach Access (Mobile App table)
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pr_history') THEN
    ALTER TABLE pr_history ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "coaches_view_client_pr_history" ON pr_history;

    CREATE POLICY "coaches_view_client_pr_history" ON pr_history
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM coach_client_connections
          WHERE coach_id = auth.uid()
          AND client_id = pr_history.user_id
          AND status = 'accepted'
        )
      );
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 7. TRAINING_PROGRAMS - Coach Access (Mobile App table)
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_programs') THEN
    ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "coaches_view_client_programs" ON training_programs;

    CREATE POLICY "coaches_view_client_programs" ON training_programs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM coach_client_connections
          WHERE coach_id = auth.uid()
          AND client_id = training_programs.user_id
          AND status = 'accepted'
        )
      );
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- Verify all policies
-- ═══════════════════════════════════════════════════════════════
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND (
  tablename IN ('workout_sessions', 'workout_sets', 'workout_history',
                'user_training_summary', 'exercise_statistics', 'pr_history',
                'training_programs')
  OR policyname LIKE '%coach%'
)
ORDER BY tablename, policyname;
