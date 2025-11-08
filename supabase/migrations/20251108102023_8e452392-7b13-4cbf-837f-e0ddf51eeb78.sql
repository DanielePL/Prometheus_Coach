-- Add reminders field to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS reminders integer[] DEFAULT ARRAY[]::integer[];

COMMENT ON COLUMN public.events.reminders IS 'Array of reminder times in minutes before event (e.g., [15, 60, 1440] for 15 min, 1 hour, 1 day)';

-- Enable real-time for user_world_clock_timezones table
ALTER TABLE public.user_world_clock_timezones REPLICA IDENTITY FULL;