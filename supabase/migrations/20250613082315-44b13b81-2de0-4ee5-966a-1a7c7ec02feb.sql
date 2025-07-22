
-- Add a unique reference ID to character_images table for cross-referencing
ALTER TABLE public.character_images 
ADD COLUMN reference_id UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create an index on reference_id for faster lookups
CREATE INDEX idx_character_images_reference_id ON public.character_images(reference_id);

-- Create a stories table to store generated stories with character image references
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  character_image_reference_id UUID REFERENCES public.character_images(reference_id),
  title TEXT,
  content TEXT NOT NULL,
  genre TEXT,
  character_name TEXT,
  story_length INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for stories table
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policies for stories table
CREATE POLICY "Users can view their own stories" 
  ON public.stories 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stories" 
  ON public.stories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" 
  ON public.stories 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
  ON public.stories 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index on character_image_reference_id for efficient joins
CREATE INDEX idx_stories_character_image_reference ON public.stories(character_image_reference_id);

-- Create a story_illustrations table for future scene illustrations
CREATE TABLE public.story_illustrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  character_image_reference_id UUID REFERENCES public.character_images(reference_id),
  panel_index INTEGER NOT NULL,
  panel_text TEXT,
  illustration_url TEXT NOT NULL,
  prompt_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security for story_illustrations
ALTER TABLE public.story_illustrations ENABLE ROW LEVEL SECURITY;

-- Create policies for story_illustrations (users can access illustrations for their own stories)
CREATE POLICY "Users can view illustrations for their own stories" 
  ON public.story_illustrations 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_illustrations.story_id 
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create illustrations for their own stories" 
  ON public.story_illustrations 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_illustrations.story_id 
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update illustrations for their own stories" 
  ON public.story_illustrations 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_illustrations.story_id 
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete illustrations for their own stories" 
  ON public.story_illustrations 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_illustrations.story_id 
    AND stories.user_id = auth.uid()
  ));
