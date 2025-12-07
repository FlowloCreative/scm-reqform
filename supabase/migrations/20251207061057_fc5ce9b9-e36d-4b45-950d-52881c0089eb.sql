-- Drop the permissive INSERT policy that allows unauthenticated access
DROP POLICY IF EXISTS "Anyone can create requests" ON public.skin_check_requests;

-- Create a new INSERT policy that requires authentication
CREATE POLICY "Authenticated users can create requests"
ON public.skin_check_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());