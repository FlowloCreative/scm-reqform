import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Request = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      toast.success("Request submitted successfully! You'll receive a confirmation email.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickupDateTime" className="required">Pickup Date & Time</Label>
                    <Input id="pickupDateTime" type="datetime-local" value={formData.pickupDateTime} onChange={(e) => updateField("pickupDateTime", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="returnDateTime" className="required">Return Date & Time</Label>
                    <Input id="returnDateTime" type="datetime-local" value={formData.returnDateTime} onChange={(e) => updateField("returnDateTime", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="eventStartDate" className="required">Event Start Date</Label>
                    <Input id="eventStartDate" type="date" value={formData.eventStartDate} onChange={(e) => updateField("eventStartDate", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="eventEndDate" className="required">Event End Date</Label>
                    <Input id="eventEndDate" type="date" value={formData.eventEndDate} onChange={(e) => updateField("eventEndDate", e.target.value)} required />
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
