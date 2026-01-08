-- Add delivery columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'pickup',
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS delivery_area text;