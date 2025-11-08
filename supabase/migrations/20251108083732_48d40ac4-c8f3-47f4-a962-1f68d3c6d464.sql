-- Create events table
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  event_type text NOT NULL DEFAULT 'other',
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  color text NOT NULL DEFAULT 'gray',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_event_type CHECK (event_type IN ('session', 'check-in', 'personal', 'other'))
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Users can view events they created or events assigned to them
CREATE POLICY "Users can view their events"
ON public.events
FOR SELECT
USING (
  auth.uid() = created_by OR auth.uid() = assigned_to
);

-- Users can create events
CREATE POLICY "Users can create events"
ON public.events
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

-- Only creator can update their events
CREATE POLICY "Creators can update their events"
ON public.events
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Only creator can delete their events
CREATE POLICY "Creators can delete their events"
ON public.events
FOR DELETE
USING (auth.uid() = created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add index for performance
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_events_assigned_to ON public.events(assigned_to);
CREATE INDEX idx_events_start_time ON public.events(start_time);