-- Create coach_client_connections table
CREATE TABLE IF NOT EXISTS public.coach_client_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id, client_id)
);

-- Enable RLS
ALTER TABLE public.coach_client_connections ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON public.coach_client_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for better performance
CREATE INDEX idx_coach_client_connections_coach_id ON public.coach_client_connections(coach_id);
CREATE INDEX idx_coach_client_connections_client_id ON public.coach_client_connections(client_id);
CREATE INDEX idx_coach_client_connections_status ON public.coach_client_connections(status);

-- RLS Policies
-- Coaches can view connections where they are the coach
CREATE POLICY "Coaches can view their connections"
  ON public.coach_client_connections
  FOR SELECT
  USING (auth.uid() = coach_id);

-- Clients can view connections where they are the client
CREATE POLICY "Clients can view their connections"
  ON public.coach_client_connections
  FOR SELECT
  USING (auth.uid() = client_id);

-- Only coaches can INSERT new requests
CREATE POLICY "Coaches can create connection requests"
  ON public.coach_client_connections
  FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id 
    AND public.has_role(auth.uid(), 'coach'::app_role)
  );

-- Only clients can UPDATE status (accept/decline)
CREATE POLICY "Clients can update connection status"
  ON public.coach_client_connections
  FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (
    auth.uid() = client_id 
    AND status IN ('accepted', 'declined')
  );

-- Coaches can also update their own requests (e.g., cancel)
CREATE POLICY "Coaches can update their own requests"
  ON public.coach_client_connections
  FOR UPDATE
  USING (auth.uid() = coach_id AND status = 'pending')
  WITH CHECK (auth.uid() = coach_id);

-- Function to notify when connection request is sent
CREATE OR REPLACE FUNCTION public.notify_client_on_connection_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coach_name TEXT;
BEGIN
  -- Get coach's name
  SELECT full_name INTO coach_name
  FROM profiles
  WHERE id = NEW.coach_id;
  
  -- Create notification for client
  INSERT INTO notifications (user_id, message)
  VALUES (
    NEW.client_id,
    coach_name || ' sent you a coaching connection request'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new connection requests
CREATE TRIGGER on_connection_request_created
  AFTER INSERT ON public.coach_client_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_on_connection_request();

-- Function to notify when connection is accepted
CREATE OR REPLACE FUNCTION public.notify_coach_on_connection_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_name TEXT;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get client's name
    SELECT full_name INTO client_name
    FROM profiles
    WHERE id = NEW.client_id;
    
    -- Create notification for coach
    INSERT INTO notifications (user_id, message)
    VALUES (
      NEW.coach_id,
      client_name || ' accepted your coaching connection request'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for accepted connections
CREATE TRIGGER on_connection_accepted
  AFTER UPDATE ON public.coach_client_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_coach_on_connection_accepted();