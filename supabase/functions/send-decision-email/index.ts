import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DecisionData {
  requestId: string;
  email: string;
  employeeName: string;
  status: string;
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: DecisionData = await req.json();
    console.log("Sending decision email for:", data.requestId);

    const isApproved = data.status === "Approved";
    const statusColor = isApproved ? "#10b981" : "#ef4444";

    const emailResponse = await resend.emails.send({
      from: "Skin Check Request <onboarding@resend.dev>",
      to: [data.email],
      subject: `Request ${data.status}: ${data.requestId}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Request ${data.status}</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <p>Dear ${data.employeeName},</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
              <h2 style="margin-top: 0; color: ${statusColor};">
                Your request ${data.requestId} has been ${data.status.toLowerCase()}
              </h2>
              ${data.adminNotes ? `<p><strong>Admin Notes:</strong><br>${data.adminNotes}</p>` : ""}
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
