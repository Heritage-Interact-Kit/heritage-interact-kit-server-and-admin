-- Create storage bucket for assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for assets bucket
CREATE POLICY "Public can view assets"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'assets' );

CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can update their own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'assets' AND auth.role() = 'authenticated' ); 