-- ═══════════════════════════════════════════════════════════════
-- PR (Personal Records) TABLES AND POLICIES
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Create exercise_statistics table if it doesn't exist
CREATE TABLE IF NOT EXISTS exercise_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exercise_id TEXT NOT NULL,

  -- Weight PR
  pr_weight_kg DECIMAL(10,2),
  pr_weight_reps INTEGER,
  pr_weight_date TIMESTAMP WITH TIME ZONE,
  pr_weight_session_id UUID,

  -- Reps PR
  pr_reps INTEGER,
  pr_reps_weight_kg DECIMAL(10,2),
  pr_reps_date TIMESTAMP WITH TIME ZONE,
  pr_reps_session_id UUID,

  -- Volume PR
  pr_volume_kg DECIMAL(10,2),
  pr_volume_date TIMESTAMP WITH TIME ZONE,
  pr_volume_session_id UUID,

  -- Velocity PR (VBT)
  pr_velocity DECIMAL(10,4),
  pr_velocity_date TIMESTAMP WITH TIME ZONE,
  pr_velocity_session_id UUID,

  -- Estimated 1RM
  estimated_1rm_kg DECIMAL(10,2),
  estimated_1rm_date TIMESTAMP WITH TIME ZONE,

  -- Aggregates
  total_volume_kg DECIMAL(12,2) DEFAULT 0,
  total_sets INTEGER DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,

  -- Timestamps
  first_performed_at TIMESTAMP WITH TIME ZONE,
  last_performed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, exercise_id)
);

-- Create pr_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS pr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exercise_id TEXT NOT NULL,
  session_id UUID,

  pr_type TEXT NOT NULL CHECK (pr_type IN ('weight', 'volume', 'velocity', 'reps')),

  weight_kg DECIMAL(10,2),
  reps INTEGER,
  volume_kg DECIMAL(10,2),
  velocity DECIMAL(10,4),

  previous_pr_value DECIMAL(10,4),
  improvement_percentage DECIMAL(10,2),

  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exercise_statistics_user ON exercise_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_statistics_exercise ON exercise_statistics(exercise_id);
CREATE INDEX IF NOT EXISTS idx_pr_history_user ON pr_history(user_id);
CREATE INDEX IF NOT EXISTS idx_pr_history_exercise ON pr_history(exercise_id);
CREATE INDEX IF NOT EXISTS idx_pr_history_achieved ON pr_history(achieved_at);

-- Enable RLS
ALTER TABLE exercise_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_manage_own_stats" ON exercise_statistics;
DROP POLICY IF EXISTS "coaches_view_client_stats" ON exercise_statistics;
DROP POLICY IF EXISTS "users_manage_own_pr_history" ON pr_history;
DROP POLICY IF EXISTS "coaches_view_client_pr_history" ON pr_history;

-- Users can manage their own exercise statistics
CREATE POLICY "users_manage_own_stats" ON exercise_statistics
  FOR ALL USING (user_id = auth.uid());

-- Coaches can view their connected clients' exercise statistics
CREATE POLICY "coaches_view_client_stats" ON exercise_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_client_connections
      WHERE coach_id = auth.uid()
      AND client_id = exercise_statistics.user_id
      AND status = 'accepted'
    )
  );

-- Users can manage their own PR history
CREATE POLICY "users_manage_own_pr_history" ON pr_history
  FOR ALL USING (user_id = auth.uid());

-- Coaches can view their connected clients' PR history
CREATE POLICY "coaches_view_client_pr_history" ON pr_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_client_connections
      WHERE coach_id = auth.uid()
      AND client_id = pr_history.user_id
      AND status = 'accepted'
    )
  );

-- Verify
SELECT 'PR tables and policies created' as status;
