-- Drop the existing function since its return type will change
DROP FUNCTION IF EXISTS public.get_booking_periods(text);

-- Convert timestamp columns to date
ALTER TABLE public.skin_check_requests
  ALTER COLUMN pickup_datetime TYPE date USING pickup_datetime::date,
  ALTER COLUMN return_datetime TYPE date USING return_datetime::date,
  ALTER COLUMN actual_return_datetime TYPE date USING actual_return_datetime::date;

-- Recreate the booking periods function with date return types
CREATE OR REPLACE FUNCTION public.get_booking_periods(p_machine_unit text DEFAULT NULL::text)
RETURNS TABLE(
  machine_unit text,
  pickup_datetime date,
  return_datetime date,
  event_start_date date,
  event_end_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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
$function$;