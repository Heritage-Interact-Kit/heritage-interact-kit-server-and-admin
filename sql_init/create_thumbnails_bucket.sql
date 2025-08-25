-- Create storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for thumbnails bucket
CREATE POLICY "Public can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'thumbnails' );

CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'thumbnails' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can update their own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'thumbnails' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can delete their own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'thumbnails' AND auth.role() = 'authenticated' ); 