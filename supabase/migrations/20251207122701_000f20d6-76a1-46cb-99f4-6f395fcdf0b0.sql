-- Drop the overly permissive policy that exposes all data
DROP POLICY IF EXISTS "Authenticated users can view booking dates for availability" ON public.skin_check_requests;

-- Create a secure function that only returns booking dates (no PII)
CREATE OR REPLACE FUNCTION public.get_booking_periods(p_machine_unit text DEFAULT NULL)
RETURNS TABLE (
  machine_unit text,
  pickup_datetime timestamptz,
  return_datetime timestamptz,
  event_start_date date,
  event_end_date date,
  request_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    scr.machine_unit,
    scr.pickup_datetime,
    scr.return_datetime,
    scr.event_start_date,
    scr.event_end_date,
    scr.request_status
  FROM public.skin_check_requests scr
  WHERE (p_machine_unit IS NULL OR scr.machine_unit = p_machine_unit)
    AND scr.request_status != 'Rejected'
$$;