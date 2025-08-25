-- Create enum for interaction methods
CREATE TYPE interaction_method_enum AS ENUM (
    'place_on_plane',
    'show_on_marker', 
    'show_ar_portal',
    'show_directly'
);

-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT,
    description TEXT,
    model_url TEXT,
    material_urls TEXT[],
    thumbnail_image_url TEXT,
    marker_image_url TEXT,
    audio_url TEXT,
    video_url TEXT,
    interaction_method interaction_method_enum DEFAULT 'place_on_plane',
    object_id BIGINT NOT NULL,
    folder_id TEXT,

    CONSTRAINT assets_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE
);

-- Add Row Level Security (RLS)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all assets" ON public.assets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert new assets" ON public.assets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update any asset" ON public.assets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete any asset" ON public.assets
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;

-- Grant usage and select on the sequence
GRANT USAGE, SELECT ON SEQUENCE public.assets_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.assets_id_seq TO service_role; 