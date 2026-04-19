
-- 1. Profiles: restrict SELECT to owner only
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Orders: allow authenticated users to view their own orders by email match
CREATE POLICY "Users can view own orders by email"
ON public.orders
FOR SELECT
TO authenticated
USING (
  user_email IS NOT NULL
  AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 3. Remove orders from realtime publication to prevent unauthorized subscriptions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.orders';
  END IF;
END $$;

-- 4. Add length constraints on reviews
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_name_length CHECK (char_length(user_name) BETWEEN 1 AND 100),
  ADD CONSTRAINT reviews_comment_length CHECK (comment IS NULL OR char_length(comment) <= 1000),
  ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
