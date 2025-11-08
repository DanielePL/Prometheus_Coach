-- Update the notification trigger to format messages in a way that's clearly identifiable as calendar events
CREATE OR REPLACE FUNCTION public.notify_client_on_event_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    
    -- Format event details with structured data for frontend parsing
    v_event_details := '📅 CALENDAR_EVENT_NOTIFICATION' || E'\n' ||
                       'title:' || NEW.title || E'\n' ||
                       'type:' || NEW.event_type || E'\n' ||
                       'start:' || TO_CHAR(NEW.start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') || E'\n' ||
                       'end:' || TO_CHAR(NEW.end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') || E'\n' ||
                       'assigned_by:' || creator_name || E'\n';
    
    IF NEW.description IS NOT NULL AND NEW.description != '' THEN
      v_event_details := v_event_details || 'description:' || NEW.description || E'\n';
    END IF;
    
    IF NEW.is_recurring THEN
      v_event_details := v_event_details || 'recurring:' || NEW.recurrence_pattern || E'\n';
    END IF;
    
    -- Add event ID for linking
    v_event_details := v_event_details || 'event_id:' || NEW.id::text;
    
    -- Send message to inbox (from coach to client)
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (v_conversation_id, NEW.created_by, v_event_details);
  END IF;
  
  RETURN NEW;
END;
$function$;