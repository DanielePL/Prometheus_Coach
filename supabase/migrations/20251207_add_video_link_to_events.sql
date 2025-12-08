-- ═══════════════════════════════════════════════════════════════
-- ADD VIDEO LINK TO EVENTS
-- Allows coaches to attach Google Meet/Zoom links to events
-- ═══════════════════════════════════════════════════════════════

-- Add video_link column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS video_link text;

-- Add comment for documentation
COMMENT ON COLUMN public.events.video_link IS 'Optional video call link (Google Meet, Zoom, etc.) for the event';
