-- Simple public setup for task-images bucket (for testing/development)
-- Run this in your Supabase SQL Editor for a quick setup

-- Create the bucket (same as file 01)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, owner)
VALUES (
  'task-images',
  'task-images', 
  true, -- Make bucket public
  false,
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'], -- Allowed image types
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Simple policies for development (less secure but easier for testing)
CREATE POLICY "Allow all operations on task images (development only)"
ON storage.objects
FOR ALL
USING (bucket_id = 'task-images')
WITH CHECK (bucket_id = 'task-images');

-- Grant permissions to public and authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT, INSERT ON storage.objects TO anon; 