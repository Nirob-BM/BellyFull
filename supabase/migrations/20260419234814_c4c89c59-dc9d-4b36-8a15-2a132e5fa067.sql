-- Drop existing INSERT policy that's blocking customer orders, and the email-based SELECT
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders by email" ON public.orders;

-- Re-create INSERT policy targeting anon + authenticated explicitly, with field validation
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(user_name) BETWEEN 1 AND 100
  AND char_length(user_phone) BETWEEN 5 AND 20
  AND (user_email IS NULL OR char_length(user_email) <= 255)
  AND char_length(transaction_id) BETWEEN 1 AND 100
  AND char_length(payment_method) BETWEEN 1 AND 50
  AND (delivery_address IS NULL OR char_length(delivery_address) <= 500)
  AND (delivery_area IS NULL OR char_length(delivery_area) <= 100)
  AND total_amount >= 0
  AND total_amount <= 1000000
  AND order_status = 'pending'
);