-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create skin check requests table
CREATE TABLE public.skin_check_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE NOT NULL,
  
  -- Section 1: Requested By
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Section 2: Event Details
  event_name TEXT NOT NULL,
  location TEXT NOT NULL,
  expected_users INTEGER NOT NULL,
  
  -- Section 3: Booking Schedule
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ NOT NULL,
  event_start_date DATE NOT NULL,
  event_end_date DATE NOT NULL,
  
  -- Section 4: Equipment Tracking
  machine_unit TEXT NOT NULL,
  inform_to TEXT NOT NULL,
  
  -- Section 5: Usage Requirements
  used_before BOOLEAN NOT NULL,
  need_training BOOLEAN NOT NULL,
  special_requirements TEXT,
  
  -- Section 6: Admin Use Only
  request_status TEXT NOT NULL DEFAULT 'Pending',
  approved_by TEXT,
  admin_notes TEXT,
  
  -- Section 7: Return Condition
  condition_pickup TEXT,
  condition_return TEXT,
  return_notes TEXT,
  actual_return_datetime TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on requests
ALTER TABLE public.skin_check_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for skin_check_requests
CREATE POLICY "Anyone can create requests"
  ON public.skin_check_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own requests"
  ON public.skin_check_requests FOR SELECT
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests"
  ON public.skin_check_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all requests"
  ON public.skin_check_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.skin_check_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();