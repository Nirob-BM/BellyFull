-- Drop any existing media-related policies to start clean
DROP POLICY IF EXISTS "Admins can list media objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Media is viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;

-- Admin-only listing/management; public file URLs still work via /object/public/
CREATE POLICY "Admins can list media objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));