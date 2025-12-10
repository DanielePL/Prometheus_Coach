-- Drop and recreate body_measurements table with ALL columns
DROP TABLE IF EXISTS body_measurements CASCADE;

CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  date DATE NOT NULL,
  neck NUMERIC,
  shoulders NUMERIC,
  chest NUMERIC,
  arms NUMERIC,
  forearms NUMERIC,
  waist NUMERIC,
  hips NUMERIC,
  glutes NUMERIC,
  legs NUMERIC,
  calves NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view body measurements"
ON body_measurements FOR SELECT
USING (
  client_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM coach_client_connections
    WHERE coach_id = auth.uid() AND client_id = body_measurements.client_id AND status = 'accepted'
  )
);

CREATE POLICY "Clients can manage their own measurements"
ON body_measurements FOR ALL
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Index
CREATE INDEX idx_body_measurements_client ON body_measurements(client_id);
CREATE INDEX idx_body_measurements_date ON body_measurements(date);
