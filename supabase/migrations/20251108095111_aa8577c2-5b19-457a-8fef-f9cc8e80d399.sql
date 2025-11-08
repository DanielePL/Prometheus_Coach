-- Create business hours table
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

-- Create blocked time slots table
CREATE TABLE IF NOT EXISTS public.blocked_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_time_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_hours
CREATE POLICY "Users can view their own business hours"
  ON public.business_hours FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business hours"
  ON public.business_hours FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business hours"
  ON public.business_hours FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business hours"
  ON public.business_hours FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for blocked_time_slots
CREATE POLICY "Users can view their own blocked time slots"
  ON public.blocked_time_slots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blocked time slots"
  ON public.blocked_time_slots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blocked time slots"
  ON public.blocked_time_slots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocked time slots"
  ON public.blocked_time_slots FOR DELETE
  USING (auth.uid() = user_id);

-- Coaches can view client business hours and blocked times
CREATE POLICY "Coaches can view client business hours"
  ON public.business_hours FOR SELECT
  USING (
    has_role(auth.uid(), 'coach'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Coaches can view client blocked time slots"
  ON public.blocked_time_slots FOR SELECT
  USING (
    has_role(auth.uid(), 'coach'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create calendar integration tokens table for OAuth
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  calendar_id TEXT,
  is_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS for calendar_integrations
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar integrations"
  ON public.calendar_integrations FOR ALL
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON public.business_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_blocked_time_slots_updated_at
  BEFORE UPDATE ON public.blocked_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();