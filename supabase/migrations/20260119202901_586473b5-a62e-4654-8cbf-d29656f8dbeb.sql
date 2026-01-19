-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'participant');

-- Create gender enum
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'non_binary');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'participant',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create participants table
CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    age INTEGER NOT NULL CHECK (age >= 18),
    gender gender_type NOT NULL,
    partner_preference gender_type[] NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    registration_complete BOOLEAN NOT NULL DEFAULT false,
    questionnaire_complete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Create questionnaire_responses table
CREATE TABLE public.questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    -- Section A: MCQ answers
    q1_friday_night TEXT,
    q2_humour TEXT,
    q3_conflict_style TEXT,
    -- Section B: Rankings (stored as arrays)
    q4_life_pillars TEXT[],
    q5_love_languages TEXT[],
    -- Section C: Sliders (1-5)
    q6_social_battery INTEGER CHECK (q6_social_battery >= 1 AND q6_social_battery <= 5),
    q7_spontaneity INTEGER CHECK (q7_spontaneity >= 1 AND q7_spontaneity <= 5),
    q8_ambition INTEGER CHECK (q8_ambition >= 1 AND q8_ambition <= 5),
    q9_productivity INTEGER CHECK (q9_productivity >= 1 AND q9_productivity <= 5),
    q10_date_preference INTEGER CHECK (q10_date_preference >= 1 AND q10_date_preference <= 5),
    -- Metadata
    current_step INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on questionnaire_responses
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Create matches table
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    match_1_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    match_1_score INTEGER,
    match_2_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    match_2_score INTEGER,
    match_3_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    match_3_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create app_settings table for admin controls
CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO public.app_settings (key, value) VALUES 
    ('matching_locked', 'false'::jsonb),
    ('results_visible', 'false'::jsonb),
    ('admin_code', '"DARVIX2024"'::jsonb);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON public.participants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questionnaire_responses_updated_at
    BEFORE UPDATE ON public.questionnaire_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for participants
CREATE POLICY "Users can view their own participant profile"
    ON public.participants FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own participant profile"
    ON public.participants FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant profile"
    ON public.participants FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all participants"
    ON public.participants FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for questionnaire_responses
CREATE POLICY "Users can view their own responses"
    ON public.questionnaire_responses FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
    ON public.questionnaire_responses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
    ON public.questionnaire_responses FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses"
    ON public.questionnaire_responses FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for matches
CREATE POLICY "Users can view their own matches"
    ON public.matches FOR SELECT
    TO authenticated
    USING (participant_id IN (SELECT id FROM public.participants WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all matches"
    ON public.matches FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for app_settings
CREATE POLICY "Anyone can read settings"
    ON public.app_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can update settings"
    ON public.app_settings FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));