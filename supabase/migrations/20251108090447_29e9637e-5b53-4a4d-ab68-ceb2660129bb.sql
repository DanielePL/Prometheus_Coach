-- Add recurring event fields to events table
ALTER TABLE public.events
ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
ADD COLUMN recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN recurrence_days TEXT[], -- For weekly: ['mon', 'wed', 'fri']
ADD COLUMN recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_events_parent_event_id ON public.events(parent_event_id);
CREATE INDEX idx_events_is_recurring ON public.events(is_recurring);

-- Function to generate recurring event instances
CREATE OR REPLACE FUNCTION public.generate_recurring_events(
  p_event_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_recurrence_pattern TEXT,
  p_recurrence_interval INTEGER,
  p_recurrence_days TEXT[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_current_date TIMESTAMP WITH TIME ZONE;
  v_event_duration INTERVAL;
  v_count INTEGER := 0;
  v_day_name TEXT;
BEGIN
  -- Get the parent event details
  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Calculate event duration
  v_event_duration := v_event.end_time - v_event.start_time;
  
  -- Set the starting point for generation
  v_current_date := p_start_date;
  
  -- Generate instances based on pattern
  WHILE v_current_date <= p_end_date LOOP
    -- For weekly pattern, check if current day matches selected days
    IF p_recurrence_pattern = 'weekly' AND p_recurrence_days IS NOT NULL THEN
      v_day_name := LOWER(TO_CHAR(v_current_date, 'Dy'));
      
      IF v_day_name = ANY(p_recurrence_days) THEN
        -- Create instance
        INSERT INTO events (
          title, description, start_time, end_time, event_type,
          color, created_by, assigned_to, parent_event_id, is_recurring
        ) VALUES (
          v_event.title, v_event.description, v_current_date, v_current_date + v_event_duration,
          v_event.event_type, v_event.color, v_event.created_by, v_event.assigned_to,
          p_event_id, false
        );
        v_count := v_count + 1;
      END IF;
      
      -- Move to next day for weekly check
      v_current_date := v_current_date + INTERVAL '1 day';
    ELSIF p_recurrence_pattern = 'daily' THEN
      -- Create daily instance
      INSERT INTO events (
        title, description, start_time, end_time, event_type,
        color, created_by, assigned_to, parent_event_id, is_recurring
      ) VALUES (
        v_event.title, v_event.description, v_current_date, v_current_date + v_event_duration,
        v_event.event_type, v_event.color, v_event.created_by, v_event.assigned_to,
        p_event_id, false
      );
      v_count := v_count + 1;
      
      -- Move to next occurrence
      v_current_date := v_current_date + (p_recurrence_interval || ' days')::INTERVAL;
    ELSIF p_recurrence_pattern = 'monthly' THEN
      -- Create monthly instance
      INSERT INTO events (
        title, description, start_time, end_time, event_type,
        color, created_by, assigned_to, parent_event_id, is_recurring
      ) VALUES (
        v_event.title, v_event.description, v_current_date, v_current_date + v_event_duration,
        v_event.event_type, v_event.color, v_event.created_by, v_event.assigned_to,
        p_event_id, false
      );
      v_count := v_count + 1;
      
      -- Move to next occurrence
      v_current_date := v_current_date + (p_recurrence_interval || ' months')::INTERVAL;
    ELSE
      EXIT;
    END IF;
    
    -- Safety check to prevent infinite loops
    IF v_count > 1000 THEN
      RAISE EXCEPTION 'Too many instances to generate (max 1000)';
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Trigger to auto-generate recurring instances when creating a recurring event
CREATE OR REPLACE FUNCTION public.handle_recurring_event_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instances_created INTEGER;
  v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Only process if this is a new recurring event (not an instance)
  IF NEW.is_recurring = true AND NEW.parent_event_id IS NULL THEN
    -- Set default end date if not provided (3 months from start)
    v_end_date := COALESCE(NEW.recurrence_end_date, NEW.start_time + INTERVAL '3 months');
    
    -- Generate recurring instances
    v_instances_created := generate_recurring_events(
      NEW.id,
      NEW.start_time + (
        CASE NEW.recurrence_pattern
          WHEN 'daily' THEN (NEW.recurrence_interval || ' days')::INTERVAL
          WHEN 'weekly' THEN '1 week'::INTERVAL
          WHEN 'monthly' THEN (NEW.recurrence_interval || ' months')::INTERVAL
          ELSE '0 days'::INTERVAL
        END
      ),
      v_end_date,
      NEW.recurrence_pattern,
      NEW.recurrence_interval,
      NEW.recurrence_days
    );
    
    RAISE NOTICE 'Created % recurring event instances', v_instances_created;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_handle_recurring_event
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_recurring_event_creation();