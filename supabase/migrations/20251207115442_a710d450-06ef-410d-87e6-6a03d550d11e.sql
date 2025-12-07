-- Allow all authenticated users to read booking dates for availability checking
CREATE POLICY "Authenticated users can view booking dates for availability"
ON public.skin_check_requests
FOR SELECT
USING (auth.uid() IS NOT NULL);