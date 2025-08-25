-- Create storage bucket for task images
-- Run this in your Supabase SQL Editor

-- Create the task-images bucket
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