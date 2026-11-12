import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { canCancelRequest, todayInYangon } from "@/lib/cancel-rules";

interface Row {
  id: string; request_id: string; event_name: string; location: string;
  event_start_date: string; event_end_date: string; pickup_datetime: string;
  return_datetime: string; machine_unit: string; request_status: string;
}

const fmt = (d: string) => format(parseISO(d), "MMM d, yyyy");

const MyRequests = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    const { data, error } = await supabase
      .from("skin_check_requests")
      .select("id,request_id,event_name,location,event_start_date,event_end_date,pickup_datetime,return_datetime,machine_unit,request_status")
      .eq("created_by", session.user.id)
      .order("event_start_date", { ascending: false });
    if (error) toast.error("Could not load your requests");
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("cancel_my_request", { p_id: id });
    setBusy(null);
    if (error) { toast.error("This request can no longer be cancelled"); return; }
    toast.success("Request cancelled");
    load();
  };

  const today = todayInYangon();
  const variant = (s: string) =>
    s === "Approved" ? "default" : s === "Rejected" ? "destructive" : s === "Cancelled" ? "outline" : "secondary";

  return (
    <main className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/request")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to form
        </Button>
        <h1 className="text-2xl font-bold">My Requests</h1>
        {loading ? <Loader2 className="animate-spin" /> : rows.length === 0 ? (
          <p className="text-muted-foreground">You have no requests yet.</p>
        ) : rows.map(r => (
          <Card key={r.id} className="glass-effect">
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{r.event_name} <span className="text-muted-foreground text-sm">({r.request_id})</span></CardTitle>
              <Badge variant={variant(r.request_status) as any}>{r.request_status}</Badge>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>{r.location} · {r.machine_unit}</p>
              <p>Event: {fmt(r.event_start_date)} – {fmt(r.event_end_date)}</p>
              <p>Pickup {fmt(r.pickup_datetime)} · Return {fmt(r.return_datetime)}</p>
              {canCancelRequest(r.request_status, r.event_start_date, today) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="mt-2" disabled={busy === r.id}>
                      {busy === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel request"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                      <AlertDialogDescription>The booked dates will become available to others. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep</AlertDialogCancel>
                      <AlertDialogAction onClick={() => cancel(r.id)}>Yes, cancel</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
};
export default MyRequests;
