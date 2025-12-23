import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
const AdminReview = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [adminData, setAdminData] = useState({
    requestStatus: "Pending",
    approvedBy: "",
    adminNotes: "",
    conditionPickup: "",
    conditionReturn: "",
    returnNotes: "",
    actualReturnDateTime: ""
  });
  useEffect(() => {
    checkAuthAndFetch();
  }, [id]);
  const checkAuthAndFetch = async () => {
    try {
      // First verify authentication and admin role
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin/login');
        return;
      }
      const {
        data: roleData
      } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').maybeSingle();
      if (!roleData) {
        toast.error('Admin access required');
        navigate('/');
        return;
      }
      setIsAdmin(true);

      // Now fetch the request data
      const {
        data,
        error
      } = await supabase.from("skin_check_requests").select("*").eq("request_id", id).single();
      if (error) throw error;
      setRequest(data);
      // Format datetime for datetime-local input (YYYY-MM-DDTHH:MM)
      const formatDateTimeForInput = (dateStr: string | null) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setAdminData({
        requestStatus: data.request_status || "Pending",
        approvedBy: data.approved_by || "",
        adminNotes: data.admin_notes || "",
        conditionPickup: data.condition_pickup || "",
        conditionReturn: data.condition_return || "",
        returnNotes: data.return_notes || "",
        actualReturnDateTime: formatDateTimeForInput(data.actual_return_datetime)
      });
    } catch (error: any) {
      toast.error("Failed to load request");
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from("skin_check_requests").update({
        request_status: adminData.requestStatus,
        approved_by: adminData.approvedBy,
        admin_notes: adminData.adminNotes,
        condition_pickup: adminData.conditionPickup || null,
        condition_return: adminData.conditionReturn || null,
        return_notes: adminData.returnNotes || null,
        actual_return_datetime: adminData.actualReturnDateTime || null
      }).eq("request_id", id);
      if (error) throw error;

      // Send notification email to requester
      await supabase.functions.invoke("send-decision-email", {
        body: {
          requestId: request.request_id,
          email: request.email,
          employeeName: request.employee_name,
          status: adminData.requestStatus,
          adminNotes: adminData.adminNotes
        }
      });

      // Update Google Sheets
      await supabase.functions.invoke("update-google-sheet", {
        body: {
          requestId: request.request_id,
          ...adminData
        }
      });
      toast.success("Request updated successfully!");
      navigate("/admin");
    } catch (error: any) {
      toast.error("Failed to update request");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen gradient-bg flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>;
  }
  if (!request) return null;
  return <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-6 text-white hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="glass-effect shadow-2xl">
          <CardHeader className="border-b border-primary/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Review Request: {request.request_id}</CardTitle>
              <Badge variant={request.request_status === "Approved" ? "default" : "secondary"}>
                {request.request_status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* Section 1-5: View Only */}
            <div className="space-y-6 bg-muted/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-inherit">Requester Information (Read-Only)</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={request.employee_name} disabled />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={request.department} disabled />
                </div>
                <div>
                  <Label>Position</Label>
                  <Input value={request.position} disabled />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={request.phone_number} disabled />
                </div>
                <div className="md:col-span-2">
                  <Label>Email</Label>
                  <Input value={request.email} disabled />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Event Details</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Event Name</Label>
                    <Input value={request.event_name} disabled />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value={request.location} disabled />
                  </div>
                  <div>
                    <Label>Expected Users</Label>
                    <Input value={request.expected_users} disabled />
                  </div>
                  <div>
                    <Label>Machine Unit</Label>
                    <Input value={request.machine_unit} disabled />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Schedule</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Pickup</Label>
                    <Input value={new Date(request.pickup_datetime).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} disabled />
                  </div>
                  <div>
                    <Label>Return</Label>
                    <Input value={new Date(request.return_datetime).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} disabled />
                  </div>
                  <div>
                    <Label>Event Start</Label>
                    <Input value={request.event_start_date} disabled />
                  </div>
                  <div>
                    <Label>Event End</Label>
                    <Input value={request.event_end_date} disabled />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Admin Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-inherit">6. Admin Decision</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requestStatus">Request Status</Label>
                  <Select value={adminData.requestStatus} onValueChange={value => setAdminData({
                  ...adminData,
                  requestStatus: value
                })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="approvedBy">Approved By</Label>
                  <Input id="approvedBy" value={adminData.approvedBy} onChange={e => setAdminData({
                  ...adminData,
                  approvedBy: e.target.value
                })} />
                </div>
              </div>
              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea id="adminNotes" value={adminData.adminNotes} onChange={e => setAdminData({
                ...adminData,
                adminNotes: e.target.value
              })} className="min-h-[100px]" />
              </div>
            </div>

            {/* Section 7: Return Condition */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-inherit">7. Return Condition</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="conditionPickup">Condition at Pickup</Label>
                  <Select value={adminData.conditionPickup} onValueChange={value => setAdminData({
                  ...adminData,
                  conditionPickup: value
                })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Not Yet Picked Up" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Minor Issues">Minor Issues</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="conditionReturn">Condition at Return</Label>
                  <Select value={adminData.conditionReturn} onValueChange={value => setAdminData({
                  ...adminData,
                  conditionReturn: value
                })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Not Yet Returned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Minor Issues">Minor Issues</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="returnNotes">Return Notes</Label>
                <Textarea id="returnNotes" value={adminData.returnNotes} onChange={e => setAdminData({
                ...adminData,
                returnNotes: e.target.value
              })} className="min-h-[100px]" />
              </div>
              <div>
                <Label htmlFor="actualReturnDateTime">Actual Return Date & Time</Label>
                <Input id="actualReturnDateTime" type="datetime-local" value={adminData.actualReturnDateTime} onChange={e => setAdminData({
                ...adminData,
                actualReturnDateTime: e.target.value
              })} />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6">
              {saving ? "Saving..." : "Save & Send Notification"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AdminReview;