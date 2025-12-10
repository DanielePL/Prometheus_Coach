-- Coach daily goals table
CREATE TABLE IF NOT EXISTS coach_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE coach_goals ENABLE ROW LEVEL SECURITY;

-- Coaches can only see their own goals
CREATE POLICY "Coaches can manage their own goals"
ON coach_goals FOR ALL
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_coach_goals_coach_date ON coach_goals(coach_id, date);
