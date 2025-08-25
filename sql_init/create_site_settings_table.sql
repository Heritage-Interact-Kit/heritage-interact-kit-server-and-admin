-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id BIGSERIAL PRIMARY KEY,
    site_name TEXT NOT NULL,
    site_logo_url TEXT,
    site_banner_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins only for site settings)
CREATE POLICY "Admins can view site settings" ON public.site_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert site settings" ON public.site_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update site settings" ON public.site_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete site settings" ON public.site_settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

-- Grant usage and select on the sequence
GRANT USAGE, SELECT ON SEQUENCE public.site_settings_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.site_settings_id_seq TO service_role;

-- Add comment for the site_logo_url column
COMMENT ON COLUMN public.site_settings.site_logo_url IS 'URL to the site logo image stored in Supabase storage';

-- Add comment for the site_banner_image_url column
COMMENT ON COLUMN public.site_settings.site_banner_image_url IS 'URL to the site banner image stored in Supabase storage';

-- Insert default site settings record (only one record should exist)
INSERT INTO public.site_settings (site_name, site_logo_url, site_banner_image_url) 
VALUES ('Heritage Interact Kit', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Add a constraint to ensure only one settings record exists
CREATE UNIQUE INDEX IF NOT EXISTS unique_site_settings ON public.site_settings ((true)); 