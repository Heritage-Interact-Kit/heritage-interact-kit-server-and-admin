-- Create tour_objects join table
CREATE TABLE IF NOT EXISTS public.tour_objects (
    tour_id BIGINT NOT NULL,
    object_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT tour_objects_pkey PRIMARY KEY (tour_id, object_id),
    CONSTRAINT tour_objects_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE CASCADE,
    CONSTRAINT tour_objects_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE
);

-- Add Row Level Security (RLS)
ALTER TABLE public.tour_objects ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all tour-object links" ON public.tour_objects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own tour-object links" ON public.tour_objects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own tour-object links" ON public.tour_objects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own tour-object links" ON public.tour_objects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.tour_objects TO authenticated;
GRANT ALL ON public.tour_objects TO service_role; 