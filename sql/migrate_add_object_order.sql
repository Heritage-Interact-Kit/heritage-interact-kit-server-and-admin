-- Migration script to add object_order field to tours table
-- Run this script to update existing database

BEGIN;

-- Add object_order field to tours table
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS object_order BIGINT[];

-- Add comment for the new column
COMMENT ON COLUMN public.tours.object_order IS 'Array of object IDs in the desired display order for this tour';

-- Create an index for better performance when filtering by object order
CREATE INDEX IF NOT EXISTS idx_tours_object_order ON public.tours USING GIN (object_order);

-- Populate existing tours with current object order based on creation time
-- This preserves the current order for existing tours
UPDATE public.tours 
SET object_order = (
    SELECT ARRAY_AGG(to_obj.object_id ORDER BY to_obj.created_at ASC)
    FROM public.tour_objects to_obj
    WHERE to_obj.tour_id = tours.id
)
WHERE object_order IS NULL;

COMMIT;
