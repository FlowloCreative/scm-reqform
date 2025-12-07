import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// HTML escape function to prevent injection
const escapeHtml = (str: string | undefined | null): string => {
  if (!str) return "";
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] || c));
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const decisionSchema = z.object({
  requestId: z.string().min(1).max(50),
  email: z.string().email().max(255),
  employeeName: z.string().min(1).max(100),
  status: z.enum(["Approved", "Rejected", "Pending"]),
  adminNotes: z.string().max(1000).optional(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT and check admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Invalid token:", userError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("User is not an admin:", user.id);
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate input
    const rawData = await req.json();
    const parseResult = decisionSchema.safeParse(rawData);
    
    if (!parseResult.success) {
      console.error("Validation failed:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data = parseResult.data;
    console.log("Sending decision email for:", data.requestId, "by admin:", user.id);

    const isApproved = data.status === "Approved";
    const statusColor = isApproved ? "#10b981" : "#ef4444";

    const emailResponse = await resend.emails.send({
      from: "Skin Check Request <noreply@mydomain.com>",
      to: [data.email],
      subject: `Request ${escapeHtml(data.status)}: ${escapeHtml(data.requestId)}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Request ${escapeHtml(data.status)}</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <p>Dear ${escapeHtml(data.employeeName)},</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
              <h2 style="margin-top: 0; color: ${statusColor};">
                Your request ${escapeHtml(data.requestId)} has been ${escapeHtml(data.status.toLowerCase())}
              </h2>
              ${data.adminNotes ? `<p><strong>Admin Notes:</strong><br>${escapeHtml(data.adminNotes)}</p>` : ""}
            </div>
            
            ${isApproved ? `
              <p>Your machine booking has been confirmed. Please ensure you:</p>
              <ul>
                <li>Arrive on time for pickup</li>
                <li>Inspect the machine condition before taking it</li>
                <li>Return the machine on time and in good condition</li>
              </ul>
            ` : `
              <p>Unfortunately, your request could not be approved at this time. If you have any questions, please contact the admin team.</p>
            `}
            
            <p>Best regards,<br>The Equipment Management Team</p>
          </div>
        </div>
      `,
    });

    console.log("Decision email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending decision email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
