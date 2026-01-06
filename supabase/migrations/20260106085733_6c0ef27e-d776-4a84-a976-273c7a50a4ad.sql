-- Add images array column to menu_items for multiple product images
ALTER TABLE public.menu_items 
ADD COLUMN images text[] DEFAULT '{}';

-- Migrate existing image_url to images array if exists
UPDATE public.menu_items 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '';

-- Create reviews table for product reviews
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are viewable by everyone
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews 
FOR SELECT 
USING (true);

-- Anyone can create reviews
CREATE POLICY "Anyone can create reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (true);

-- Admins can manage reviews
CREATE POLICY "Admins can manage reviews" 
ON public.reviews 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));