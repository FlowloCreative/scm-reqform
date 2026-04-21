
CREATE POLICY "Admins can view site-asset files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'site-asset' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upload site-asset files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-asset' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site-asset files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-asset' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site-asset files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-asset' AND has_role(auth.uid(), 'admin'::app_role));
