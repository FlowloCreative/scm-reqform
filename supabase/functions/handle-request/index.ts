import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestData {
  requestId: string;
  employeeName: string;
  email: string;
  department: string;
  position: string;
  phoneNumber: string;
  eventName: string;
  location: string;
  expectedUsers: string;
  pickupDateTime: string;
  returnDateTime: string;
  eventStartDate: string;
  eventEndDate: string;
  machineUnit: string;
  informTo: string;
  usedBefore: string;
  needTraining: string;
  specialRequirements?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: RequestData = await req.json();
    console.log("Processing request:", data.requestId);

    // Send email to admin
    const adminEmail = data.informTo === "YGN-Admin" ? "admin-ygn@example.com" : "admin-mdy@example.com";
    
    const reviewUrl = `${Deno.env.get("SUPABASE_URL")}/admin/review/${data.requestId}`;

    const emailResponse = await resend.emails.send({
      from: "Skin Check Request <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `New Request: ${data.requestId} - ${data.eventName}`,
      html: `
        <h1>New Skin Check Machine Request</h1>
        <h2>Request ID: ${data.requestId}</h2>
        
        <h3>Requester Information</h3>
        <ul>
          <li><strong>Name:</strong> ${data.employeeName}</li>
          <li><strong>Department:</strong> ${data.department}</li>
          <li><strong>Position:</strong> ${data.position}</li>
          <li><strong>Phone:</strong> ${data.phoneNumber}</li>
          <li><strong>Email:</strong> ${data.email}</li>
        </ul>
        
        <h3>Event Details</h3>
        <ul>
          <li><strong>Event:</strong> ${data.eventName}</li>
          <li><strong>Location:</strong> ${data.location}</li>
          <li><strong>Expected Users:</strong> ${data.expectedUsers}</li>
        </ul>
        
        <h3>Schedule</h3>
        <ul>
          <li><strong>Pickup:</strong> ${new Date(data.pickupDateTime).toLocaleString()}</li>
          <li><strong>Return:</strong> ${new Date(data.returnDateTime).toLocaleString()}</li>
          <li><strong>Event Dates:</strong> ${data.eventStartDate} to ${data.eventEndDate}</li>
        </ul>
        
        <h3>Equipment</h3>
        <ul>
          <li><strong>Machine Unit:</strong> ${data.machineUnit}</li>
          <li><strong>Used Before:</strong> ${data.usedBefore}</li>
          <li><strong>Training Needed:</strong> ${data.needTraining}</li>
        </ul>
        
        ${data.specialRequirements ? `<p><strong>Special Requirements:</strong> ${data.specialRequirements}</p>` : ""}
        
        <p><a href="${reviewUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px;">Review Request</a></p>
      `,
    });

    console.log("Admin email sent:", emailResponse);

    // Sync to Google Sheets
    try {
      await syncToGoogleSheets(data);
      console.log("Synced to Google Sheets");
    } catch (sheetError) {
      console.error("Google Sheets sync error:", sheetError);
      // Don't fail the request if sheets sync fails
    }

    // Send confirmation to requester
    await resend.emails.send({
      from: "Skin Check Request <onboarding@resend.dev>",
      to: [data.email],
      subject: `Request Confirmation: ${data.requestId}`,
      html: `
        <h1>Thank you for your request!</h1>
        <p>Dear ${data.employeeName},</p>
        <p>Your skin check machine request has been received and is being reviewed.</p>
        
        <h3>Request Details</h3>
        <ul>
          <li><strong>Request ID:</strong> ${data.requestId}</li>
          <li><strong>Event:</strong> ${data.eventName}</li>
          <li><strong>Location:</strong> ${data.location}</li>
          <li><strong>Pickup:</strong> ${new Date(data.pickupDateTime).toLocaleString()}</li>
        </ul>
        
        <p>You will receive an email once your request has been reviewed by the admin team.</p>
        <p>Best regards,<br>The Equipment Management Team</p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in handle-request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function syncToGoogleSheets(data: RequestData) {
  const credentials = Deno.env.get("GOOGLE_SHEETS_CREDENTIALS");
  if (!credentials) {
    console.log("No Google Sheets credentials configured");
    return;
  }

  // Parse credentials and implement Google Sheets API call
  // This is a placeholder for the actual implementation
  console.log("Google Sheets sync would happen here");
}

serve(handler);
