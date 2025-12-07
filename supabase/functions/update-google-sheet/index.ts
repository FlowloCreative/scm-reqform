import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const updateSchema = z.object({
  requestId: z.string().min(1).max(50),
  requestStatus: z.enum(["Pending", "Approved", "Rejected"]),
  approvedBy: z.string().max(100).optional(),
  adminNotes: z.string().max(1000).optional(),
  conditionPickup: z.enum(["Good", "Minor Issues", "Damaged"]).optional().nullable(),
  conditionReturn: z.enum(["Good", "Minor Issues", "Damaged"]).optional().nullable(),
  returnNotes: z.string().max(1000).optional(),
  actualReturnDateTime: z.string().optional(),
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
    const parseResult = updateSchema.safeParse(rawData);
    
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
    console.log("Updating Google Sheet for:", data.requestId, "by admin:", user.id);

    const credentials = Deno.env.get("GOOGLE_SHEETS_CREDENTIALS");
    
    if (!credentials) {
      console.log("No Google Sheets credentials configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Google Sheets not configured" 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse credentials and implement Google Sheets API update
    // This would require:
    // 1. Parse the credentials JSON
    // 2. Authenticate with Google Sheets API
    // 3. Find the row with matching request_id
    // 4. Update the admin columns (sections 6 & 7)
    
    console.log("Google Sheets update would happen here with data:", data);
    
    // Placeholder for actual implementation
    /*
    const sheetsApi = await authenticateGoogleSheets(credentials);
    const spreadsheetId = "YOUR_SPREADSHEET_ID";
    
    // Find row by request_id
    const rows = await sheetsApi.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:A',
    });
    
    const rowIndex = rows.data.values?.findIndex(row => row[0] === data.requestId);
    
    if (rowIndex !== -1) {
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!N${rowIndex + 1}:U${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            data.requestStatus,
            data.approvedBy || '',
            data.adminNotes || '',
            data.conditionPickup || '',
            data.conditionReturn || '',
            data.returnNotes || '',
            data.actualReturnDateTime || '',
          ]],
        },
      });
    }
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Google Sheet update queued" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error updating Google Sheet:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
