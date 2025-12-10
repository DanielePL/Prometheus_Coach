-- Add neck and glutes columns to body_measurements table
ALTER TABLE body_measurements
ADD COLUMN IF NOT EXISTS neck NUMERIC,
ADD COLUMN IF NOT EXISTS glutes NUMERIC;

-- Add comments for clarity
COMMENT ON COLUMN body_measurements.neck IS 'Neck circumference in cm';
COMMENT ON COLUMN body_measurements.glutes IS 'Glutes circumference in cm';
