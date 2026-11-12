DROP FUNCTION IF EXISTS public.get_booking_periods(text);
CREATE FUNCTION public.get_booking_periods(p_machine_unit text DEFAULT NULL)
RETURNS TABLE(machine_unit text, pickup_datetime date, return_datetime date, event_start_date date, event_end_date date, employee_name text, "position" text, phone_number text, event_name text, location text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT r.machine_unit, r.pickup_datetime, r.return_datetime, r.event_start_date, r.event_end_date,
    r.employee_name, r.position, r.phone_number, r.event_name, r.location
  FROM public.skin_check_requests r
  WHERE r.request_status IN ('Approved','Pending')
    AND (p_machine_unit IS NULL OR r.machine_unit = p_machine_unit);
END; $$;
REVOKE ALL ON FUNCTION public.get_booking_periods(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_booking_periods(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_request(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.skin_check_requests SET request_status = 'Cancelled'
  WHERE id = p_id AND created_by = auth.uid()
    AND request_status IN ('Pending','Approved')
    AND event_start_date >= (now() AT TIME ZONE 'Asia/Yangon')::date;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request cannot be cancelled'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.cancel_my_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_request(uuid) TO authenticated;