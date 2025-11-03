-- Create enum for exercise categories
CREATE TYPE exercise_category AS ENUM ('bodybuilding', 'crossfit', 'powerlifting', 'weightlifting', 'functional', 'plyometrics');

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category exercise_category NOT NULL,
  video_filename TEXT NOT NULL,
  cloudfront_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercises
CREATE POLICY "Anyone can view exercises"
  ON public.exercises
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert exercises"
  ON public.exercises
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update exercises"
  ON public.exercises
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete exercises"
  ON public.exercises
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create user_favorite_exercises table
CREATE TABLE public.user_favorite_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

-- Enable RLS
ALTER TABLE public.user_favorite_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_favorite_exercises
CREATE POLICY "Users can view their own favorites"
  ON public.user_favorite_exercises
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
  ON public.user_favorite_exercises
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
  ON public.user_favorite_exercises
  FOR DELETE
  USING (auth.uid() = user_id);