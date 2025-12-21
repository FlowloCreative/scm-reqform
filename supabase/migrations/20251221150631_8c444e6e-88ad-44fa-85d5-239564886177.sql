-- Drop and recreate the get_booking_periods function without request_status to minimize data exposure
DROP FUNCTION IF EXISTS public.get_booking_periods(text);

CREATE OR REPLACE FUNCTION public.get_booking_periods(p_machine_unit text DEFAULT NULL)
RETURNS TABLE (
  machine_unit text,
  pickup_datetime timestamp with time zone,
  return_datetime timestamp with time zone,
  event_start_date date,
  event_end_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function intentionally uses SECURITY DEFINER to allow users to see
  -- booking availability across all approved requests (not their own).
  -- Only returns booking periods for Approved or Pending requests to show availability.
  -- No PII or status information is exposed - only dates and machine info.
  RETURN QUERY
  SELECT 
    r.machine_unit,
    r.pickup_datetime,
    r.return_datetime,
    r.event_start_date,
    r.event_end_date
  FROM public.skin_check_requests r
  WHERE r.request_status IN ('Approved', 'Pending')
    AND (p_machine_unit IS NULL OR r.machine_unit = p_machine_unit);
END;
$$;