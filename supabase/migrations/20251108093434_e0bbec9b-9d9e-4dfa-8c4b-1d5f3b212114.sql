-- Add timezone preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_timezone TEXT DEFAULT 'UTC';

-- Add a comment to describe the column
COMMENT ON COLUMN public.profiles.preferred_timezone IS 'User preferred timezone for calendar events (IANA timezone format)';