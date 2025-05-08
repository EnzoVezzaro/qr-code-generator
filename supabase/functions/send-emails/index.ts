import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend"; // Import Resend
import QRCode from 'https://esm.sh/qrcode'; // Import qrcode library

console.log("Hello from send-emails function!");

// Create a Supabase client with the Auth context of the function
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  {
    global: {
      headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
    },
  }
);

// Initialize Resend client
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Handle non-POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }

    // Log the raw request body for debugging
    // Note: Reading the body stream once consumes it. If you need to read it multiple times,
    // you should clone the request first: const reqClone = req.clone();
    // For JSON, req.json() is generally preferred over req.text() + JSON.parse()
    console.log("Received request:", req); // Log the entire request object for more context

    let body: any; // Keep any for now as the structure is dynamic
    let rawBodyText: string | null = null;
    try {
      // Attempt to parse the request body as JSON
      body = await req.json();
      console.log("Received request body (parsed):", body);
    } catch (jsonError: unknown) { // Use unknown for caught errors
      console.error("Error parsing request body as JSON:", jsonError);
      // If parsing fails, try reading as text for debugging the raw content
      try {
        // Clone the request before reading the body as text, as req.json() might have partially consumed it
        const reqClone = req.clone();
        rawBodyText = await reqClone.text();
        console.log("Received request body (raw text):", rawBodyText);
      } catch (textError: unknown) { // Use unknown for caught errors
         console.error("Also failed to read request body as text:", textError);
         // If reading as text also fails, return a generic error
         return new Response(
          JSON.stringify({ error: "Failed to read request body", details: textError instanceof Error ? textError.message : String(textError) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // If reading as text was successful, return a more detailed error
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body", 
          details: jsonError instanceof Error ? jsonError.message : String(jsonError), 
          rawBody: rawBodyText 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate required parameters
    const { participantIds, templateId, eventId } = body as { participantIds: string[], templateId: string, eventId: string }; // Cast to expected type
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "participantIds must be a non-empty array" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!templateId) {
      return new Response(
        JSON.stringify({ error: "templateId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: "eventId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }


    // Fetch template details
    const { data: template, error: templateError } = await supabaseClient
      .from("email_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError) {
      console.error("Error fetching template:", templateError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch template: ${templateError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const { data: eventData } = await supabaseClient
      .from("events")
      .select("*")
      .eq("id", eventId);

    // Fetch participant details
    const { data: participants, error: participantsError } = await supabaseClient
      .from("participants")
      .select("*")
      .eq("event_id", eventId)
      .in("id", participantIds);

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch participants: ${participantsError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const sentEmails = [];
    const failedEmails = [];

    for (const participant of participants) {
      let emailStatus = "failed";
      let errorMessage = null;
      let resendId = null;

      try {
        const emailContent = await processTemplate(template.body, participant, eventData); // Added await here

        const { data, error: resendError } = await resend.emails.send({
          from: 'onboarding@resend.dev', // Replace with your verified sender email
          to: participant.email,
          subject: template.subject,
          html: emailContent, // Now emailContent is the resolved string
        });

        if (resendError) {
          console.error(`Error sending email to ${participant.email} via Resend:`, resendError);
          errorMessage = resendError.message || "Resend sending error";
          emailStatus = "failed";
        } else {
          console.log(`Email sent successfully to ${participant.email}. Resend ID: ${data?.id}`);
          emailStatus = "sent";
          resendId = data?.id || null;
        }

      } catch (sendError: any) {
        console.error(`Unexpected error sending email to ${participant.email}:`, sendError);
        errorMessage = sendError.message || "Unknown sending error";
        emailStatus = "failed";
      }

      // Log the email sending attempt
      const { error: logError } = await supabaseClient
        .from("email_logs") // Assuming an email_logs table exists
        .insert({
          participant_id: participant.id,
          template_id: templateId,
          event_id: eventId,
          status: emailStatus,
          recipient_email: participant.email,
          recipient_name: participant.name,
          subject: template.subject,
          content: await processTemplate(template.body, participant, eventData), // Store processed content, await the promise
          sent_at: emailStatus === "sent" ? new Date().toISOString() : null,
          error_message: errorMessage,
          resend_id: resendId, // Store Resend ID
        });

      if (logError) {
        console.error(`Error logging email for ${participant.email}:`, logError);
        // Continue processing other emails even if logging fails for one
      }

      if (emailStatus === "sent") {
        sentEmails.push(participant.email);
      } else {
        failedEmails.push({ email: participant.email, error: errorMessage });
      }
    }

    // Return response indicating processing is complete
    return new Response(
      JSON.stringify({
        success: true,
        message: `Attempted to send emails to ${participants.length} participants using Resend.`,
        sentCount: sentEmails.length,
        failedCount: failedEmails.length,
        failedEmails: failedEmails, // Include details of failed emails
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Helper function to process template with participant data
interface ProcessTemplateParticipant {
  id: string; // Assuming participant has an id
  name?: string;
  qr_token?: string;
  email: string; // Assuming participant has an email
  // Add other participant properties used in templates here
}

async function processTemplate(templateContent: string, participant: ProcessTemplateParticipant, eventData: { name: string } | null): Promise<string> {
  let content = templateContent;
  
  // Replace template variables with actual values
  content = content.replace(/{{name}}/g, participant.name || "");
  content = content.replace(/{{event}}/g, eventData?.name || ""); // Safely access eventData.name

  // Generate QR code as SVG string using participant.qr_token
  let qrCodeHtml = '';
  if (participant.qr_token) {
    try {
      // Generate QR code as SVG string for server-side rendering
      qrCodeHtml = await QRCode.toString(participant.qr_token, { type: 'svg' });
    } catch (err) {
      console.error("Error generating QR code:", err);
      // Fallback or error handling if QR code generation fails
      qrCodeHtml = '<div>Error generating QR Code</div>'; // Placeholder or error message
    }
  } else {
     console.warn("participant.qr_token is missing for participant:", participant);
     qrCodeHtml = '<div>QR Code not available</div>'; // Placeholder or warning message
  }


  // Replace {{qr_link}} with the generated QR code HTML (SVG)
  content = content.replace(/{{qr_link}}/g, qrCodeHtml);
  
  // Add more replacements as needed
  // For example, you might want to include event details, ticket info, etc.
  
  return content;
}
