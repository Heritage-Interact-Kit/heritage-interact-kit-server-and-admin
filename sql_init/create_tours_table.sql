-- Create tours table
CREATE TABLE IF NOT EXISTS public.tours (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    description TEXT,
    thumbnail_url TEXT,
    object_order BIGINT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Row Level Security (RLS)
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all tours" ON public.tours
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own tours" ON public.tours
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own tours" ON public.tours
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own tours" ON public.tours
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role;

-- Grant usage and select on the sequence
GRANT USAGE, SELECT ON SEQUENCE public.tours_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.tours_id_seq TO service_role;

-- Add comments for columns
COMMENT ON COLUMN public.tours.thumbnail_url IS 'URL to the tour thumbnail image stored in Supabase storage';
COMMENT ON COLUMN public.tours.object_order IS 'Array of object IDs in the desired display order for this tour';

-- Create an index for better performance when filtering by object order
CREATE INDEX IF NOT EXISTS idx_tours_object_order ON public.tours USING GIN (object_order); 