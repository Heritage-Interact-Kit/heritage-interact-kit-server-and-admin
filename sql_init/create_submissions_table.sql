-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL,
    end_user_id BIGINT NOT NULL,
    object_id BIGINT NOT NULL,
    remarks TEXT,
    submitted_files TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT fk_submissions_task_id FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_end_user_id FOREIGN KEY (end_user_id) REFERENCES public.end_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_object_id FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE
);

-- Add Row Level Security (RLS)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated admin users
CREATE POLICY "Admins can view all submissions" ON public.submissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update submissions" ON public.submissions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete submissions" ON public.submissions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for end users to manage their own submissions
CREATE POLICY "End users can view their own submissions" ON public.submissions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT auth_user_id FROM public.end_users WHERE id = end_user_id
        )
    );

CREATE POLICY "End users can create their own submissions" ON public.submissions
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT auth_user_id FROM public.end_users WHERE id = end_user_id
        )
    );

CREATE POLICY "End users can update their own submissions" ON public.submissions
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM public.end_users WHERE id = end_user_id
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

-- Grant usage and select on the sequence
GRANT USAGE, SELECT ON SEQUENCE public.submissions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.submissions_id_seq TO service_role;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON public.submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_end_user_id ON public.submissions(end_user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_object_id ON public.submissions(object_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at);

-- Add comments
COMMENT ON TABLE public.submissions IS 'User submissions for tasks in the heritage mobile application';
COMMENT ON COLUMN public.submissions.task_id IS 'Reference to the task this submission belongs to';
COMMENT ON COLUMN public.submissions.end_user_id IS 'Reference to the end user who created this submission';
COMMENT ON COLUMN public.submissions.object_id IS 'Direct reference to the object this submission belongs to (for easier filtering and performance)';
COMMENT ON COLUMN public.submissions.remarks IS 'User remarks or notes for the submission';
COMMENT ON COLUMN public.submissions.submitted_files IS 'Array of URLs to submitted files/images stored in Supabase storage';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_submissions_updated_at
    BEFORE UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_submissions_updated_at(); 