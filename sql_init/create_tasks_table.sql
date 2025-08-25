-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id BIGSERIAL PRIMARY KEY,
    object_id BIGINT NOT NULL,
    title TEXT,
    description TEXT,
    thumbnail_url TEXT,
    detailed_img_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT fk_tasks_object_id FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE
);

-- Add Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all tasks" ON public.tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert new tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update any task" ON public.tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete any task" ON public.tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

-- Grant usage and select on the sequence
GRANT USAGE, SELECT ON SEQUENCE public.tasks_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.tasks_id_seq TO service_role;

-- Add comment for the thumbnail_url column
COMMENT ON COLUMN public.tasks.thumbnail_url IS 'URL to the task thumbnail image stored in Supabase storage';

-- Add comment for the detailed_img_url column
COMMENT ON COLUMN public.tasks.detailed_img_url IS 'URL to the detailed image for the task stored in Supabase storage';

-- Add index on object_id for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_object_id ON public.tasks(object_id); 