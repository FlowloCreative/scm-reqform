import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
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

// Zod schema for input validation
const requestSchema = z.object({
  requestId: z.string().min(1, "Request ID is required").max(50, "Request ID too long"),
  employeeName: z.string().min(1, "Employee name is required").max(100, "Employee name too long"),
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  department: z.string().min(1, "Department is required").max(100, "Department too long"),
  position: z.string().min(1, "Position is required").max(100, "Position too long"),
  phoneNumber: z.string().min(1, "Phone number is required").max(20, "Phone number too long"),
  eventName: z.string().min(1, "Event name is required").max(200, "Event name too long"),
  location: z.string().min(1, "Location is required").max(300, "Location too long"),
  expectedUsers: z.string().min(1, "Expected users is required").max(20, "Expected users value too long"),
  pickupDateTime: z.string().min(1, "Pickup date/time is required"),
  returnDateTime: z.string().min(1, "Return date/time is required"),
  eventStartDate: z.string().min(1, "Event start date is required"),
  eventEndDate: z.string().min(1, "Event end date is required"),
  machineUnit: z.string().min(1, "Machine unit is required").max(50, "Machine unit too long"),
  informTo: z.string().min(1, "Inform to is required").max(50, "Inform to value too long"),
  usedBefore: z.string().min(1, "Used before is required").max(10, "Used before value too long"),
  needTraining: z.string().min(1, "Need training is required").max(10, "Need training value too long"),
  specialRequirements: z.string().max(1000, "Special requirements too long").optional(),
});

type RequestData = z.infer<typeof requestSchema>;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    
    // Validate input data
    const parseResult = requestSchema.safeParse(rawData);
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
    console.log("Processing validated request:", data.requestId);

    // Send email to admin
    const adminEmail = data.informTo === "YGN-Admin" ? "flowlocreative@gmail.com" : "drmozzgaming@gmail.com";
    
    const reviewUrl = `https://8f85b45b-80f0-42f2-8471-028dc93beed0.lovableproject.com/admin/review/${data.requestId}`;

    const emailResponse = await resend.emails.send({
      from: "Skin Check Request <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `New Request: ${escapeHtml(data.requestId)} - ${escapeHtml(data.eventName)}`,
      html: `
        <h1>New Skin Check Machine Request</h1>
        <h2>Request ID: ${escapeHtml(data.requestId)}</h2>
        
        <h3>Requester Information</h3>
        <ul>
          <li><strong>Name:</strong> ${escapeHtml(data.employeeName)}</li>
          <li><strong>Department:</strong> ${escapeHtml(data.department)}</li>
          <li><strong>Position:</strong> ${escapeHtml(data.position)}</li>
          <li><strong>Phone:</strong> ${escapeHtml(data.phoneNumber)}</li>
          <li><strong>Email:</strong> ${escapeHtml(data.email)}</li>
        </ul>
        
        <h3>Event Details</h3>
        <ul>
          <li><strong>Event:</strong> ${escapeHtml(data.eventName)}</li>
          <li><strong>Location:</strong> ${escapeHtml(data.location)}</li>
          <li><strong>Expected Users:</strong> ${escapeHtml(data.expectedUsers)}</li>
        </ul>
        
        <h3>Schedule</h3>
        <ul>
          <li><strong>Pickup:</strong> ${escapeHtml(new Date(data.pickupDateTime).toLocaleString())}</li>
          <li><strong>Return:</strong> ${escapeHtml(new Date(data.returnDateTime).toLocaleString())}</li>
          <li><strong>Event Dates:</strong> ${escapeHtml(data.eventStartDate)} to ${escapeHtml(data.eventEndDate)}</li>
        </ul>
        
        <h3>Equipment</h3>
        <ul>
          <li><strong>Machine Unit:</strong> ${escapeHtml(data.machineUnit)}</li>
          <li><strong>Used Before:</strong> ${escapeHtml(data.usedBefore)}</li>
          <li><strong>Training Needed:</strong> ${escapeHtml(data.needTraining)}</li>
        </ul>
        
        ${data.specialRequirements ? `<p><strong>Special Requirements:</strong> ${escapeHtml(data.specialRequirements)}</p>` : ""}
        
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
      subject: `Request Confirmation: ${escapeHtml(data.requestId)}`,
      html: `
        <h1>Thank you for your request!</h1>
        <p>Dear ${escapeHtml(data.employeeName)},</p>
        <p>Your skin check machine request has been received and is being reviewed.</p>
        
        <h3>Request Details</h3>
        <ul>
          <li><strong>Request ID:</strong> ${escapeHtml(data.requestId)}</li>
          <li><strong>Event:</strong> ${escapeHtml(data.eventName)}</li>
          <li><strong>Location:</strong> ${escapeHtml(data.location)}</li>
          <li><strong>Pickup:</strong> ${escapeHtml(new Date(data.pickupDateTime).toLocaleString())}</li>
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
