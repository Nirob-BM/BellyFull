-- Reservations: public may only submit pending, sane bookings
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
CREATE POLICY "Anyone can create pending reservations" ON public.reservations
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND length(btrim(name)) BETWEEN 1 AND 100
  AND length(btrim(phone)) BETWEEN 6 AND 20
  AND length(email) BETWEEN 3 AND 255
  AND guests BETWEEN 1 AND 50
  AND date >= (now() AT TIME ZONE 'Asia/Dhaka')::date
  AND (special_requests IS NULL OR length(special_requests) <= 1000)
);

-- Reviews: valid rating, real dish, bounded text
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;
CREATE POLICY "Anyone can create valid reviews" ON public.reviews
FOR INSERT TO anon, authenticated
WITH CHECK (
  rating BETWEEN 1 AND 5
  AND length(btrim(user_name)) BETWEEN 1 AND 100
  AND (comment IS NULL OR length(comment) <= 1000)
  AND EXISTS (SELECT 1 FROM public.menu_items m WHERE m.id = menu_item_id)
);

-- Contact form: unread, bounded fields
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit a valid contact message" ON public.contact_submissions
FOR INSERT TO anon, authenticated
WITH CHECK (
  coalesce(is_read, false) = false
  AND length(btrim(name)) BETWEEN 1 AND 100
  AND length(email) BETWEEN 3 AND 255
  AND (phone IS NULL OR length(phone) <= 20)
  AND length(btrim(message)) BETWEEN 1 AND 2000
);

-- has_role: only answers for the signed-in caller, so nobody can probe other accounts
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL
    AND _user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
$$;