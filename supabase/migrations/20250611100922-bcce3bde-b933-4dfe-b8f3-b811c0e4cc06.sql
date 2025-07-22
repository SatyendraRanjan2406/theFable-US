
-- Create a table to store processed character images
CREATE TABLE public.character_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  original_filename TEXT NOT NULL,
  processed_image_url TEXT NOT NULL,
  character_name TEXT,
  genre TEXT,
  prompt_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.character_images ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own character images" 
  ON public.character_images 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own character images" 
  ON public.character_images 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own character images" 
  ON public.character_images 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own character images" 
  ON public.character_images 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a storage bucket for character images
INSERT INTO storage.buckets 
  (id, name, public)
VALUES 
  ('character-images', 'character-images', true);

-- Create storage policies for the bucket
CREATE POLICY "Users can upload character images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'character-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view character images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'character-images');

CREATE POLICY "Users can update their character images" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'character-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their character images" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'character-images' AND auth.uid()::text = (storage.foldername(name))[1]);
