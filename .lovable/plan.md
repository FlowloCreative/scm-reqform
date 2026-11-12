# Booking details on booked dates + My Requests with cancel

## 1. Show who booked when tapping a booked date
When a signed-in requester taps a red (booked) date, the calendar shows:

```text
Phyu Thandar (Name), RSM (Position), 09454111613 (Phone)
Event Details
Sein Daung (Event), Pyinmana (Location),
2026-11-13 to 2026-11-13 (Event Date). Pickup on Nov 12, 2026 and return on Nov 16, 2026
```
Labels in brackets are shown as written; values come from the existing booking. Weekend/holiday messages stay unchanged.

## 2. My Requests page
- New page "My Requests" for signed-in requesters, linked from the request form header.
- Lists the user's own requests: ID, event, location, event dates, pickup/return, machine, status.
- "Cancel" button appears only when status is Pending or Approved AND event start date is today or later.
- Confirmation dialog before cancelling; status becomes "Cancelled".
- Cancelled requests no longer block dates in the calendar (only Pending/Approved count already).
- Admin dashboard shows the "Cancelled" status badge.

## Technical details
- Migration: extend `get_booking_periods` to also return employee_name, position, phone_number, event_name, location (only Pending/Approved rows; callable by authenticated users only).
- Migration: add a SECURITY DEFINER function `cancel_my_request(p_id uuid)` that checks `created_by = auth.uid()`, status in (Pending, Approved), `event_start_date >= current_date`, then sets status 'Cancelled'. Avoids giving users a broad UPDATE policy.
- Update `DatePickerWithBookings` info text; new `src/pages/MyRequests.tsx` + route `/my-requests`.
- Admin email notification on cancel is not included unless requested.
