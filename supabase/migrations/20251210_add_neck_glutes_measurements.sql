-- Add additional body measurement columns
ALTER TABLE body_measurements
ADD COLUMN IF NOT EXISTS neck NUMERIC,
ADD COLUMN IF NOT EXISTS glutes NUMERIC,
ADD COLUMN IF NOT EXISTS shoulders NUMERIC,
ADD COLUMN IF NOT EXISTS calves NUMERIC,
ADD COLUMN IF NOT EXISTS forearms NUMERIC;

-- Add comments for clarity
COMMENT ON COLUMN body_measurements.neck IS 'Neck circumference in cm';
COMMENT ON COLUMN body_measurements.glutes IS 'Glutes circumference in cm';
COMMENT ON COLUMN body_measurements.shoulders IS 'Shoulder circumference in cm';
COMMENT ON COLUMN body_measurements.calves IS 'Calf circumference in cm';
COMMENT ON COLUMN body_measurements.forearms IS 'Forearm circumference in cm';
