-- Add restrictive INSERT policy for user_roles table
-- Only admins can assign roles to prevent privilege escalation
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));