-- Create booking links table
CREATE TABLE IF NOT EXISTS public.booking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Book a Session',
  slug TEXT NOT NULL UNIQUE,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own booking links"
  ON public.booking_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own booking links"
  ON public.booking_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking links"
  ON public.booking_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own booking links"
  ON public.booking_links FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view enabled booking links"
  ON public.booking_links FOR SELECT
  USING (is_enabled = true);

-- Add trigger for updated_at
CREATE TRIGGER update_booking_links_updated_at
  BEFORE UPDATE ON public.booking_links
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update the notify_client_on_event_assignment function for better formatting
CREATE OR REPLACE FUNCTION public.notify_client_on_event_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  creator_name TEXT;
  v_conversation_id UUID;
  v_event_details TEXT;
BEGIN
  -- Only create notification if event is assigned to someone other than creator
  -- AND if it's not a recurring instance (parent_event_id is NULL)
  IF NEW.assigned_to IS NOT NULL 
     AND NEW.assigned_to != NEW.created_by 
     AND NEW.parent_event_id IS NULL THEN
    
    -- Get creator's name
    SELECT full_name INTO creator_name
    FROM profiles
    WHERE id = NEW.created_by;
    
    -- Create notification
    INSERT INTO notifications (user_id, event_id, message)
    VALUES (
      NEW.assigned_to,
      NEW.id,
      creator_name || ' assigned you a new event: ' || NEW.title
    );
    
    -- Create or get conversation between coach and client
    SELECT c.id INTO v_conversation_id
    FROM conversations c
    INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = NEW.created_by 
      AND cp2.user_id = NEW.assigned_to
    LIMIT 1;
    
    -- If no conversation exists, create one
    IF v_conversation_id IS NULL THEN
      INSERT INTO conversations (id) 
      VALUES (gen_random_uuid())
      RETURNING id INTO v_conversation_id;
      
      -- Add both participants
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES 
        (v_conversation_id, NEW.created_by),
        (v_conversation_id, NEW.assigned_to);
    END IF;
    
    -- Format event details with better spacing
    v_event_details := '📅 New Event Assigned' || E'\n\n' ||
                       'Event: ' || NEW.title || E'\n' ||
                       'Type: ' || NEW.event_type || E'\n\n' ||
                       'Start: ' || TO_CHAR(NEW.start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') || E'\n' ||
                       'End: ' || TO_CHAR(NEW.end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI');
    
    IF NEW.description IS NOT NULL AND NEW.description != '' THEN
      v_event_details := v_event_details || E'\n\n' || 'Description: ' || NEW.description;
    END IF;
    
    IF NEW.is_recurring THEN
      v_event_details := v_event_details || E'\n\n' || '🔁 Recurring: ' || NEW.recurrence_pattern;
    END IF;
    
    -- Add event ID for linking with better spacing
    v_event_details := v_event_details || E'\n\n' || 'Event ID: ' || NEW.id::text || E'\n\n' || '👉 View on Calendar';
    
    -- Send message to inbox
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (v_conversation_id, NEW.created_by, v_event_details);
  END IF;
  
  RETURN NEW;
END;
$function$;