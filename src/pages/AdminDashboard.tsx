import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, ExternalLink } from "lucide-react";

interface Request {
  id: string;
  request_id: string;
  employee_name: string;
  email: string;
  event_name: string;
  location: string;
  request_status: string;
  created_at: string;
  pickup_datetime: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchRequests();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!roles);
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("skin_check_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Pending: "secondary",
      Approved: "default",
      Rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white/80">Manage skin check machine requests</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {!isAdmin && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">
                You don't have admin access. Please contact an administrator to grant you admin permissions.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="glass-effect shadow-2xl">
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
            <CardDescription>View and manage machine booking requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading requests...</p>
            ) : requests.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No requests found</p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{request.request_id}</h3>
                            {getStatusBadge(request.request_status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Requester:</span> {request.employee_name}
                          </p>
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Event:</span> {request.event_name}
                          </p>
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Location:</span> {request.location}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Pickup:</span> {new Date(request.pickup_datetime).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        {isAdmin && (
                          <Button
                            onClick={() => navigate(`/admin/review/${request.request_id}`)}
                            className="gap-2 bg-gradient-to-r from-primary to-accent"
                          >
                            Review
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
