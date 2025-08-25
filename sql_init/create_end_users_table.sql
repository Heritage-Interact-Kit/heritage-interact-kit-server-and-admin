-- Create end_users table for mobile app users
CREATE TABLE IF NOT EXISTS public.end_users (
    id BIGSERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Row Level Security (RLS)
ALTER TABLE public.end_users ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated admin users
CREATE POLICY "Admins can view all end users" ON public.end_users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update end users" ON public.end_users
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete end users" ON public.end_users
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for end users to manage their own data
CREATE POLICY "End users can view their own profile" ON public.end_users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "End users can update their own profile" ON public.end_users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Updated INSERT policy to allow both service role and user self-creation
CREATE POLICY "Allow profile creation" ON public.end_users
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.role() = 'authenticated' OR
        auth.uid() = auth_user_id
    );

-- Grant necessary permissions
GRANT ALL ON public.end_users TO authenticated;
GRANT ALL ON public.end_users TO service_role;

-- Grant usage and select on the sequence
GRANT USAGE, SELECT ON SEQUENCE public.end_users_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.end_users_id_seq TO service_role;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_end_users_auth_user_id ON public.end_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_end_users_email ON public.end_users(email);
CREATE INDEX IF NOT EXISTS idx_end_users_username ON public.end_users(username);
CREATE INDEX IF NOT EXISTS idx_end_users_is_active ON public.end_users(is_active);
CREATE INDEX IF NOT EXISTS idx_end_users_created_at ON public.end_users(created_at);

-- Add comments
COMMENT ON TABLE public.end_users IS 'End users for the heritage mobile application';
COMMENT ON COLUMN public.end_users.auth_user_id IS 'Reference to Supabase auth.users table';
COMMENT ON COLUMN public.end_users.avatar_url IS 'URL to user profile picture stored in Supabase storage';
COMMENT ON COLUMN public.end_users.preferences IS 'JSON object storing user app preferences and settings';
COMMENT ON COLUMN public.end_users.is_active IS 'Whether the user account is active (for soft deletion)';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_end_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_end_users_updated_at
    BEFORE UPDATE ON public.end_users
    FOR EACH ROW
    EXECUTE FUNCTION update_end_users_updated_at(); 