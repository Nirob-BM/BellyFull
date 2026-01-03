-- Create orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name text NOT NULL,
  user_phone text NOT NULL,
  user_email text,
  product_details jsonb NOT NULL,
  total_amount numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('bkash', 'nagad')),
  transaction_id text NOT NULL UNIQUE,
  sender_phone text,
  screenshot_url text,
  order_status text NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone can create orders
CREATE POLICY "Anyone can create orders" ON public.orders
FOR INSERT WITH CHECK (true);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update orders
CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete orders
CREATE POLICY "Admins can delete orders" ON public.orders
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment settings
INSERT INTO public.site_settings (key, value) VALUES 
('payment_settings', '{"bkash_number": "01308697630", "nagad_number": "01308697630"}')
ON CONFLICT (key) DO NOTHING;