import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format, addDays, subDays, parseISO, isWithinInterval, startOfDay } from "date-fns";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { DatePickerWithBookings } from "@/components/DatePickerWithBookings";

interface BookedPeriod {
  pickup_datetime: string;
  return_datetime: string;
  machine_unit: string;
}

const Request = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookedPeriods, setBookedPeriods] = useState<BookedPeriod[]>([]);
  const [formData, setFormData] = useState({
    employeeName: "",
    department: "",
    position: "",
    phoneNumber: "",
    email: "",
    eventName: "",
    location: "",
    expectedUsers: "",
    pickupDateTime: "",
    returnDateTime: "",
    eventStartDate: "",
    eventEndDate: "",
    machineUnit: "",
    informTo: "",
    usedBefore: "No",
    needTraining: "Yes",
    specialRequirements: "",
  });

  // Fetch confirmed bookings to check availability
  useEffect(() => {
    const fetchBookedPeriods = async () => {
      const { data } = await supabase
        .from("skin_check_requests")
        .select("pickup_datetime, return_datetime, machine_unit")
        .in("request_status", ["Approved", "Pending"]);
      
      if (data) {
        setBookedPeriods(data);
      }
    };
    fetchBookedPeriods();
  }, []);

  // Calculate min/max dates based on event dates
  const pickupMinDate = useMemo(() => {
    if (!formData.eventStartDate) return "";
    const eventStart = parseISO(formData.eventStartDate);
    const minPickup = subDays(eventStart, 1);
    return format(minPickup, "yyyy-MM-dd");
  }, [formData.eventStartDate]);

  const returnMinDate = useMemo(() => {
    if (!formData.eventEndDate) return "";
    const eventEnd = parseISO(formData.eventEndDate);
    const minReturn = addDays(eventEnd, 1);
    return format(minReturn, "yyyy-MM-dd");
  }, [formData.eventEndDate]);


  // Check if pickup date conflicts with existing bookings
  const isDateAvailable = (pickupDate: string, returnDate: string, machineUnit: string): boolean => {
    if (!pickupDate || !returnDate || !machineUnit) return true;
    
    const pickup = startOfDay(parseISO(pickupDate));
    const returnD = startOfDay(parseISO(returnDate));
    
    for (const booking of bookedPeriods) {
      if (booking.machine_unit !== machineUnit) continue;
      
      const bookedPickup = startOfDay(parseISO(booking.pickup_datetime));
      const bookedReturn = startOfDay(parseISO(booking.return_datetime));
      
      // Check if there's any overlap
      if (
        isWithinInterval(pickup, { start: bookedPickup, end: bookedReturn }) ||
        isWithinInterval(returnD, { start: bookedPickup, end: bookedReturn }) ||
        isWithinInterval(bookedPickup, { start: pickup, end: returnD })
      ) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date availability
    if (!isDateAvailable(formData.pickupDateTime, formData.returnDateTime, formData.machineUnit)) {
      toast.error("Selected dates conflict with an existing booking. Please choose different dates.");
      return;
    }
    
    setLoading(true);

    try {
      const requestId = `REQ-${Date.now().toString().slice(-8)}`;
      
      const { error } = await supabase.from("skin_check_requests").insert({
        request_id: requestId,
        employee_name: formData.employeeName,
        department: formData.department,
        position: formData.position,
        phone_number: formData.phoneNumber,
        email: formData.email,
        event_name: formData.eventName,
        location: formData.location,
        expected_users: parseInt(formData.expectedUsers),
        pickup_datetime: formData.pickupDateTime,
        return_datetime: formData.returnDateTime,
        event_start_date: formData.eventStartDate,
        event_end_date: formData.eventEndDate,
        machine_unit: formData.machineUnit,
        inform_to: formData.informTo,
        used_before: formData.usedBefore === "Yes",
        need_training: formData.needTraining === "Yes",
        special_requirements: formData.specialRequirements || null,
      });

      if (error) throw error;

      // Call edge function to send email and sync to Google Sheets
      await supabase.functions.invoke("handle-request", {
        body: { requestId, ...formData },
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Reset dependent fields when event dates change
  const handleEventStartChange = (value: string) => {
    updateField("eventStartDate", value);
    updateField("pickupDateTime", "");
    updateField("eventEndDate", "");
    updateField("returnDateTime", "");
  };

  const handleEventEndChange = (value: string) => {
    updateField("eventEndDate", value);
    updateField("returnDateTime", "");
  };

  if (submitted) {
    return (
      <div className="min-h-screen gradient-bg py-8 px-4 flex items-center justify-center">
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
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
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
                    pickupDateTime: "",
                    returnDateTime: "",
                    eventStartDate: "",
                    eventEndDate: "",
                    machineUnit: "",
                    informTo: "",
                    usedBefore: "No",
                    needTraining: "Yes",
                    specialRequirements: "",
                  });
                }}
              >
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-effect shadow-2xl">
          <CardHeader className="text-center border-b border-primary/20 pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Skin Check Machine Request Form
            </CardTitle>
            <CardDescription className="text-base">Created by Dr.Mozz || Marketing Department</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Requested By */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-accent">1. Requested By</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeName" className="required">Name</Label>
                    <Input id="employeeName" value={formData.employeeName} onChange={(e) => updateField("employeeName", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="department" className="required">Department</Label>
                    <Input id="department" value={formData.department} onChange={(e) => updateField("department", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="position" className="required">Position</Label>
                    <Input id="position" value={formData.position} onChange={(e) => updateField("position", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber" className="required">Phone Number</Label>
                    <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={(e) => updateField("phoneNumber", e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="required">Email Address</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} required />
                </div>
              </div>

              {/* Section 2: Event Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-accent">2. Event/Usage Details</h3>
                <div>
                  <Label htmlFor="eventName" className="required">Event/Promotion Name</Label>
                  <Input id="eventName" value={formData.eventName} onChange={(e) => updateField("eventName", e.target.value)} required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location" className="required">Location/Venue</Label>
                    <Input id="location" value={formData.location} onChange={(e) => updateField("location", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="expectedUsers" className="required">Expected Number of Users</Label>
                    <Input id="expectedUsers" type="number" value={formData.expectedUsers} onChange={(e) => updateField("expectedUsers", e.target.value)} required />
                  </div>
                </div>
              </div>

              {/* Section 3: Booking Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-accent">3. Booking Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Select event dates first. Pickup is 1 day before event start, return is 1 day after event end.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventStartDate" className="required">Event Start Date</Label>
                    <DatePickerWithBookings
                      value={formData.eventStartDate}
                      onChange={(date) => handleEventStartChange(date)}
                      bookedPeriods={bookedPeriods}
                      machineUnit={formData.machineUnit}
                      minDate={addDays(new Date(), 1)}
                      placeholder="Select event start date"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Must be from tomorrow onwards</p>
                  </div>
                  <div>
                    <Label htmlFor="eventEndDate" className="required">Event End Date</Label>
                    <DatePickerWithBookings
                      value={formData.eventEndDate}
                      onChange={(date) => handleEventEndChange(date)}
                      bookedPeriods={bookedPeriods}
                      machineUnit={formData.machineUnit}
                      minDate={formData.eventStartDate ? parseISO(formData.eventStartDate) : addDays(new Date(), 1)}
                      disabled={!formData.eventStartDate}
                      placeholder="Select event end date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickupDateTime" className="required">Pickup Date</Label>
                    <DatePickerWithBookings
                      value={formData.pickupDateTime}
                      onChange={(date) => updateField("pickupDateTime", date)}
                      bookedPeriods={bookedPeriods}
                      machineUnit={formData.machineUnit}
                      minDate={formData.eventStartDate ? subDays(parseISO(formData.eventStartDate), 1) : undefined}
                      maxDate={formData.eventStartDate ? subDays(parseISO(formData.eventStartDate), 1) : undefined}
                      disabled={!formData.eventStartDate}
                      placeholder="Select pickup date"
                    />
                    {formData.eventStartDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: {pickupMinDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="returnDateTime" className="required">Return Date</Label>
                    <DatePickerWithBookings
                      value={formData.returnDateTime}
                      onChange={(date) => updateField("returnDateTime", date)}
                      bookedPeriods={bookedPeriods}
                      machineUnit={formData.machineUnit}
                      minDate={formData.eventEndDate ? addDays(parseISO(formData.eventEndDate), 1) : undefined}
                      maxDate={formData.eventEndDate ? addDays(parseISO(formData.eventEndDate), 1) : undefined}
                      disabled={!formData.eventEndDate}
                      placeholder="Select return date"
                    />
                    {formData.eventEndDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: {returnMinDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Equipment Tracking */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-accent">4. Equipment Tracking</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="machineUnit" className="required">Machine Unit ID</Label>
                    <Select value={formData.machineUnit} onValueChange={(value) => updateField("machineUnit", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SCM-001-YGN">SCM-001-YGN</SelectItem>
                        <SelectItem value="SCM-002-MDY">SCM-002-MDY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="informTo" className="required">Inform To</Label>
                    <Select value={formData.informTo} onValueChange={(value) => updateField("informTo", value)} required>
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
                <h3 className="text-lg font-semibold text-accent">5. Usage Requirements</h3>
                <div>
                  <Label className="required">Have you used this machine before?</Label>
                  <RadioGroup value={formData.usedBefore} onValueChange={(value) => updateField("usedBefore", value)} className="flex gap-4 mt-2">
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
                  <RadioGroup value={formData.needTraining} onValueChange={(value) => updateField("needTraining", value)} className="flex gap-4 mt-2">
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
                  <Textarea id="specialRequirements" value={formData.specialRequirements} onChange={(e) => updateField("specialRequirements", e.target.value)} className="min-h-[100px]" />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Request;
