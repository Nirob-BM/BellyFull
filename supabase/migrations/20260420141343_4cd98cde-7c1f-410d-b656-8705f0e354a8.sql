-- Drop the broad public SELECT policy and replace with one that excludes sensitive keys
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.site_settings;

CREATE POLICY "Non-sensitive settings are viewable by everyone"
ON public.site_settings
FOR SELECT
USING (key <> 'payment_settings');

CREATE POLICY "Admins can view sensitive settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (key = 'payment_settings' AND has_role(auth.uid(), 'admin'::app_role));