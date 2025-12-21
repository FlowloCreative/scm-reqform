-- Add INSERT policy: Only allow users to insert their own profile (fallback for edge cases)
-- The main profile creation happens via SECURITY DEFINER trigger, but this provides explicit policy
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Add DELETE policy: Only admins can delete profiles
-- Regular users cannot delete profiles - account deletion cascades from auth.users
CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));