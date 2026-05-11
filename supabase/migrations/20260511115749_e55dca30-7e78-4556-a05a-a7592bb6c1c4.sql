-- Replace denylist SELECT policy on site_settings with explicit allowlist
DROP POLICY IF EXISTS "Non-sensitive settings are viewable by everyone" ON public.site_settings;

CREATE POLICY "Public settings are viewable by everyone"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key IN ('general', 'design', 'seo', 'delivery_settings'));

-- SECURITY DEFINER RPC returning only the safe payment fields needed at checkout.
-- This avoids using the service role key in a publicly-callable edge function.
CREATE OR REPLACE FUNCTION public.get_public_payment_info()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'bkash_number', COALESCE(value->>'bkash_number', ''),
    'nagad_number', COALESCE(value->>'nagad_number', ''),
    'bkash_type',   COALESCE(value->>'bkash_type',   'personal'),
    'nagad_type',   COALESCE(value->>'nagad_type',   'personal')
  )
  FROM public.site_settings
  WHERE key = 'payment_settings'
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_public_payment_info() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_payment_info() TO anon, authenticated;