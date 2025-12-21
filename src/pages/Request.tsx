import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { addDays, subDays, parseISO, isWithinInterval, startOfDay, format, eachDayOfInterval } from "date-fns";
import { isOfficialOffDay, getNextWorkingDay } from "@/lib/myanmar-holidays";
import { CheckCircle, ArrowLeft, Loader2, LogOut, AlertCircle } from "lucide-react";
import { DatePickerWithBookings } from "@/components/DatePickerWithBookings";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
interface BookedPeriod {
  pickup_datetime: string;
  return_datetime: string;
  machine_unit: string;
}
const Request = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [bookedPeriods, setBookedPeriods] = useState<BookedPeriod[]>([]);
  const [dateConflictError, setDateConflictError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeName: "",
    department: "",
    position: "",
    phoneNumber: "",
    email: "",
    eventName: "",
    location: "",
    expectedUsers: "",
    pickupDate: "",
    pickupTime: "09:00",
    returnDate: "",
    returnTime: "16:00",
    eventStartDate: "",
    eventEndDate: "",
    machineUnit: "",
    informTo: "",
    usedBefore: "No",
    needTraining: "Yes",
    specialRequirements: ""
  });

  // Check authentication status
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);

      // Pre-fill email if user is logged in
      if (session?.user?.email) {
        setFormData(prev => ({
          ...prev,
          email: session.user.email || ""
        }));
      }
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
      if (session?.user?.email) {
        setFormData(prev => ({
          ...prev,
          email: session.user.email || ""
        }));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch confirmed bookings to check availability using secure RPC function
  useEffect(() => {
    const fetchBookedPeriods = async () => {
      const {
        data
      } = await supabase.rpc("get_booking_periods");
      if (data) {
        setBookedPeriods(data.map((d: any) => ({
          pickup_datetime: d.pickup_datetime,
          return_datetime: d.return_datetime,
          machine_unit: d.machine_unit
        })));
      }
    };
    fetchBookedPeriods();
  }, []);

  // Calculate pickup date (Event Start - 1 day, skip to previous working day)
  const calculatedPickupDate = useMemo(() => {
    if (!formData.eventStartDate) return null;
    const eventStart = parseISO(formData.eventStartDate);
    const dayBefore = subDays(eventStart, 1);
    // If the day before is a weekend/holiday, find the previous working day
    return getNextWorkingDay(dayBefore, "backward");
  }, [formData.eventStartDate]);

  // Calculate return date (Event End + 1 day, skip to next working day)
  const calculatedReturnDate = useMemo(() => {
    if (!formData.eventEndDate) return null;
    const eventEnd = parseISO(formData.eventEndDate);
    const dayAfter = addDays(eventEnd, 1);
    // If the day after is a weekend/holiday, find the next working day
    return getNextWorkingDay(dayAfter, "forward");
  }, [formData.eventEndDate]);

  // Check if calculated dates conflict with existing bookings
  const checkDateConflicts = useMemo(() => {
    if (!calculatedPickupDate || !calculatedReturnDate || !formData.machineUnit) {
      return {
        hasConflict: false,
        message: null
      };
    }
    const pickupStart = startOfDay(calculatedPickupDate);
    const returnEnd = startOfDay(calculatedReturnDate);

    // Get all dates in the range from pickup to return
    const allDatesInRange = eachDayOfInterval({
      start: pickupStart,
      end: returnEnd
    });
    for (const booking of bookedPeriods) {
      if (booking.machine_unit !== formData.machineUnit) continue;
      const bookedPickup = startOfDay(parseISO(booking.pickup_datetime));
      const bookedReturn = startOfDay(parseISO(booking.return_datetime));

      // Check if any date in our range overlaps with existing booking
      for (const dateToCheck of allDatesInRange) {
        if (isWithinInterval(dateToCheck, {
          start: bookedPickup,
          end: bookedReturn
        }) || dateToCheck.getTime() === bookedPickup.getTime() || dateToCheck.getTime() === bookedReturn.getTime()) {
          const pickupFormatted = format(calculatedPickupDate, "MMM d, yyyy");
          const returnFormatted = format(calculatedReturnDate, "MMM d, yyyy");
          const conflictDateFormatted = format(dateToCheck, "MMM d, yyyy");
          return {
            hasConflict: true,
            message: `Equipment unavailable for selected dates. The date ${conflictDateFormatted} (between Pickup: ${pickupFormatted} and Return: ${returnFormatted}) conflicts with an existing booking. Please choose different event dates.`
          };
        }
      }
    }
    return {
      hasConflict: false,
      message: null
    };
  }, [calculatedPickupDate, calculatedReturnDate, formData.machineUnit, bookedPeriods]);

  // Update pickup and return dates when event dates change
  useEffect(() => {
    if (calculatedPickupDate && calculatedReturnDate && !checkDateConflicts.hasConflict) {
      setFormData(prev => ({
        ...prev,
        pickupDate: format(calculatedPickupDate, "yyyy-MM-dd"),
        returnDate: format(calculatedReturnDate, "yyyy-MM-dd")
      }));
      setDateConflictError(null);
    } else if (checkDateConflicts.hasConflict) {
      setFormData(prev => ({
        ...prev,
        pickupDate: "",
        returnDate: ""
      }));
      setDateConflictError(checkDateConflicts.message);
    }
  }, [calculatedPickupDate, calculatedReturnDate, checkDateConflicts]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time for submission - use explicit timezone offset
    // We store the user's selected time as-is by appending +06:30 (Myanmar timezone)
    const pickupDateTime = formData.pickupDate ? `${formData.pickupDate}T${formData.pickupTime}:00+06:30` : "";
    const returnDateTime = formData.returnDate ? `${formData.returnDate}T${formData.returnTime}:00+06:30` : "";

    // Validate date availability (already handled by checkDateConflicts)
    if (checkDateConflicts.hasConflict) {
      toast.error("Selected dates conflict with an existing booking. Please choose different event dates.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to submit a request");
      navigate("/auth");
      return;
    }
    setLoading(true);
    try {
      const requestId = `REQ-${Date.now().toString().slice(-8)}`;
      const {
        error
      } = await supabase.from("skin_check_requests").insert({
        request_id: requestId,
        employee_name: formData.employeeName,
        department: formData.department,
        position: formData.position,
        phone_number: formData.phoneNumber,
        email: formData.email,
        event_name: formData.eventName,
        location: formData.location,
        expected_users: parseInt(formData.expectedUsers),
        pickup_datetime: pickupDateTime,
        return_datetime: returnDateTime,
        event_start_date: formData.eventStartDate,
        event_end_date: formData.eventEndDate,
        machine_unit: formData.machineUnit,
        inform_to: formData.informTo,
        used_before: formData.usedBefore === "Yes",
        need_training: formData.needTraining === "Yes",
        special_requirements: formData.specialRequirements || null,
        created_by: user.id
      });
      if (error) throw error;

      // Call edge function to send email and sync to Google Sheets
      await supabase.functions.invoke("handle-request", {
        body: {
          requestId,
          employeeName: formData.employeeName,
          email: formData.email,
          department: formData.department,
          position: formData.position,
          phoneNumber: formData.phoneNumber,
          eventName: formData.eventName,
          location: formData.location,
          expectedUsers: formData.expectedUsers,
          pickupDateTime,
          returnDateTime,
          eventStartDate: formData.eventStartDate,
          eventEndDate: formData.eventEndDate,
          machineUnit: formData.machineUnit,
          informTo: formData.informTo,
          usedBefore: formData.usedBefore,
          needTraining: formData.needTraining,
          specialRequirements: formData.specialRequirements
        }
      });
      toast.success("Request submitted successfully!");
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset dependent fields when event dates change
  const handleEventStartChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      eventStartDate: value,
      eventEndDate: "",
      pickupDate: "",
      returnDate: ""
    }));
    setDateConflictError(null);
  };
  const handleEventEndChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      eventEndDate: value
    }));
  };
  // Show loading while checking auth
  if (checkingAuth) {
    return <div className="min-h-screen gradient-bg py-8 px-4 flex items-center justify-center">
        <Card className="glass-effect shadow-2xl max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>;
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <div className="min-h-screen gradient-bg py-8 px-4 flex items-center justify-center">
        <Card className="glass-effect shadow-2xl max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Login Required</h2>
              <p className="text-muted-foreground">
                You need to be logged in to submit a request.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild variant="default" className="w-full">
                <Link to="/auth">
                  Log In / Sign Up
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  if (submitted) {
    return <div className="min-h-screen gradient-bg py-8 px-4 flex items-center justify-center">
        <Card className="glass-effect shadow-2xl max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Request Submitted!</h2>
              <p className="text-muted-foreground">
                Your request has been submitted successfully. You'll receive a confirmation email shortly.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild variant="default" className="w-full">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
              setSubmitted(false);
              setFormData({
                employeeName: "",
                department: "",
                position: "",
                phoneNumber: "",
                email: "",
                eventName: "",
                location: "",
                expectedUsers: "",
                pickupDate: "",
                pickupTime: "09:00",
                returnDate: "",
                returnTime: "16:00",
                eventStartDate: "",
                eventEndDate: "",
                machineUnit: "",
                informTo: "",
                usedBefore: "No",
                needTraining: "Yes",
                specialRequirements: ""
              });
            }}>
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  return <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-effect shadow-2xl">
          <CardHeader className="border-b border-primary/20 pb-6">
            <div className="flex justify-between items-start mb-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Home
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-[#2366ac] bg-[#2366ac] text-center font-sans">
              Skin Check Machine Request Form
            </CardTitle>
            <CardDescription className="text-base text-center">Created by Dr.Mozz || Creative Marketing Executive   </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Requested By */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-inherit">1. Requested By</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeName" className="required">Name</Label>
                    <Input id="employeeName" value={formData.employeeName} onChange={e => updateField("employeeName", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="department" className="required">Department</Label>
                    <Input id="department" value={formData.department} onChange={e => updateField("department", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="position" className="required">Position</Label>
                    <Input id="position" value={formData.position} onChange={e => updateField("position", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber" className="required">Phone Number</Label>
                    <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={e => updateField("phoneNumber", e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="required">Email Address</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => updateField("email", e.target.value)} required />
                </div>
              </div>

              {/* Section 2: Event Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-inherit">2. Event/Usage Details</h3>
                <div>
                  <Label htmlFor="eventName" className="required">Event/Promotion Name</Label>
                  <Input id="eventName" value={formData.eventName} onChange={e => updateField("eventName", e.target.value)} required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location" className="required">Location/Venue</Label>
                    <Input id="location" value={formData.location} onChange={e => updateField("location", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="expectedUsers" className="required">Expected Number of Users</Label>
                    <Input id="expectedUsers" type="number" value={formData.expectedUsers} onChange={e => updateField("expectedUsers", e.target.value)} required />
                  </div>
                </div>
              </div>

              {/* Section 3: Booking Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-inherit">3. Booking Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Select Machine Unit for available date.                                            
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="machineUnit" className="required">Select Machine Unit First</Label>
                    <Select value={formData.machineUnit} onValueChange={value => {
                    setFormData(prev => ({
                      ...prev,
                      machineUnit: value,
                      eventStartDate: "",
                      eventEndDate: "",
                      pickupDate: "",
                      returnDate: ""
                    }));
                    setDateConflictError(null);
                  }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select machine unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SCM-001-YGN">SCM-001-YGN</SelectItem>
                        <SelectItem value="SCM-002-MDY">SCM-002-MDY</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Select machine to see availability</p>
                  </div>
                  <div></div>
                  <div>
                    <Label htmlFor="eventStartDate" className="required">Event Start Date</Label>
                    <DatePickerWithBookings value={formData.eventStartDate} onChange={date => handleEventStartChange(date)} bookedPeriods={bookedPeriods} machineUnit={formData.machineUnit} minDate={addDays(new Date(), 2)} placeholder="Select event start date" disabled={!formData.machineUnit} />
                    
                  </div>
                  <div>
                    <Label htmlFor="eventEndDate" className="required">Event End Date</Label>
                    <DatePickerWithBookings value={formData.eventEndDate} onChange={date => handleEventEndChange(date)} bookedPeriods={bookedPeriods} machineUnit={formData.machineUnit} minDate={formData.eventStartDate ? parseISO(formData.eventStartDate) : addDays(new Date(), 2)} disabled={!formData.eventStartDate} placeholder="Select event end date" />
                  </div>
                </div>
                
                {/* Date conflict error message */}
                {dateConflictError && <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{dateConflictError}</p>
                  </div>}
                
                {/* Auto-calculated pickup and return dates */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickupDate" className="required">Pickup Date & Time</Label>
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <Input id="pickupDate" value={formData.pickupDate ? format(parseISO(formData.pickupDate), "PPP") : ""} placeholder="Auto-calculated from event start" disabled className={cn("bg-muted/50", dateConflictError && "border-destructive/50")} />
                      <Select value={formData.pickupTime} onValueChange={time => updateField("pickupTime", time)} disabled={!formData.pickupDate}>
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="13:00">1:00 PM</SelectItem>
                          <SelectItem value="14:00">2:00 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="16:00">4:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                  </div>
                  <div>
                    <Label htmlFor="returnDate" className="required">Return Date & Time</Label>
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <Input id="returnDate" value={formData.returnDate ? format(parseISO(formData.returnDate), "PPP") : ""} placeholder="Auto-calculated from event end" disabled className={cn("bg-muted/50", dateConflictError && "border-destructive/50")} />
                      <Select value={formData.returnTime} onValueChange={time => updateField("returnTime", time)} disabled={!formData.returnDate}>
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="13:00">1:00 PM</SelectItem>
                          <SelectItem value="14:00">2:00 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="16:00">4:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                  </div>
                </div>
              </div>

              {/* Section 4: Equipment Tracking */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-inherit">4. Equipment Tracking</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="informTo" className="required">Inform To</Label>
                    <Select value={formData.informTo} onValueChange={value => updateField("informTo", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Admin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YGN-Admin">YGN Admin</SelectItem>
                        <SelectItem value="MDY-Admin">MDY Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 5: Usage Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-inherit">5. Usage Requirements</h3>
                <div>
                  <Label className="required">Have you used this machine before?</Label>
                  <RadioGroup value={formData.usedBefore} onValueChange={value => updateField("usedBefore", value)} className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="usedYes" />
                      <Label htmlFor="usedYes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="usedNo" />
                      <Label htmlFor="usedNo" className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="required">Need training/setup assistance?</Label>
                  <RadioGroup value={formData.needTraining} onValueChange={value => updateField("needTraining", value)} className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="trainingYes" />
                      <Label htmlFor="trainingYes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="trainingNo" />
                      <Label htmlFor="trainingNo" className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="specialRequirements">Special Requirements/Notes</Label>
                  <Textarea id="specialRequirements" value={formData.specialRequirements} onChange={e => updateField("specialRequirements", e.target.value)} className="min-h-[100px]" />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6 mb-4 text-primary-foreground" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Request;