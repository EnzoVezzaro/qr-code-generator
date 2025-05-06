// This would be deployed as a Supabase Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create a Supabase client
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "")

    // Parse the request body
    const { qrCodeId } = await req.json()

    if (!qrCodeId) {
      return new Response(JSON.stringify({ error: "QR code ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get QR code details
    const { data: qrCode, error: qrCodeError } = await supabaseClient
      .from("qr_codes")
      .select("id, user_id, status, url") // Include URL here
      .eq("id", qrCodeId)
      .single()

    if (qrCodeError || !qrCode) {
      return new Response(JSON.stringify({ error: "QR code not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Check if QR code is active
    if (qrCode.status !== "active") {
      return new Response(JSON.stringify({ error: "QR code is inactive" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get user settings
    const { data: userSettings, error: settingsError } = await supabaseClient
      .from("user_settings")
      .select("*")
      .eq("user_id", qrCode.user_id)
      .single()

    // Get IP address from request
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown"

    // Check if IP is blocked
    const { data: blockedIP, error: blockedIPError } = await supabaseClient
      .from("blocked_ips")
      .select("*")
      .eq("ip_address", ipAddress)
      .eq("user_id", qrCode.user_id)
      .is("expires_at", null)
      .maybeSingle()

    if (blockedIP) {
      // Log blocked attempt
      await supabaseClient.from("security_logs").insert({
        user_id: qrCode.user_id,
        event: "Blocked scan attempt",
        details: `Blocked IP ${ipAddress} attempted to scan QR code ${qrCodeId}`,
        severity: "medium",
      })

      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get user agent and parse it
    const userAgent = req.headers.get("user-agent") || "unknown"
    const referer = req.headers.get("referer") || null

    // Simple user agent parsing (in a real app, use a proper UA parser library)
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent)
    const browser = /chrome/i.test(userAgent)
      ? "Chrome"
      : /firefox/i.test(userAgent)
        ? "Firefox"
        : /safari/i.test(userAgent)
          ? "Safari"
          : /edge/i.test(userAgent)
            ? "Edge"
            : "Other"

    const os = /windows/i.test(userAgent)
      ? "Windows"
      : /macintosh|mac os/i.test(userAgent)
        ? "macOS"
        : /android/i.test(userAgent)
          ? "Android"
          : /iphone|ipad|ipod/i.test(userAgent)
            ? "iOS"
            : /linux/i.test(userAgent)
              ? "Linux"
              : "Other"

    // Record the scan
    const { data: scan, error: scanError } = await supabaseClient
      .from("scans")
      .insert({
        qr_code_id: qrCodeId,
        ip_address: ipAddress,
        user_agent: userAgent,
        referer: referer,
        browser: browser,
        os: os,
        device_type: isMobile ? "Mobile" : "Desktop",
        // In a real app, we would use a geolocation service to get country and city
        country: "Unknown",
        city: "Unknown",
      })
      .select()
      .single()

    if (scanError) {
      return new Response(JSON.stringify({ error: "Failed to record scan", details: scanError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Check for suspicious activity if auto-blocking is enabled
    if (userSettings?.auto_block_ips) {
      const timeWindow = userSettings.time_window || 10 // Default 10 minutes
      const scanThreshold = userSettings.scan_threshold || 50 // Default 50 scans

      // Count scans from this IP in the time window
      const timeWindowStart = new Date()
      timeWindowStart.setMinutes(timeWindowStart.getMinutes() - timeWindow)

      const { count, error: countError } = await supabaseClient
        .from("scans")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ipAddress)
        .gte("created_at", timeWindowStart.toISOString())

      if (!countError && count && count > scanThreshold) {
        // Block the IP
        await supabaseClient.from("blocked_ips").insert({
          user_id: qrCode.user_id,
          ip_address: ipAddress,
          reason: `Exceeded scan threshold (${scanThreshold} scans in ${timeWindow} minutes)`,
        })

        // Log the security event
        await supabaseClient.from("security_logs").insert({
          user_id: qrCode.user_id,
          event: "IP automatically blocked",
          details: `IP ${ipAddress} blocked for exceeding scan threshold`,
          severity: "high",
        })

        // In a real app, we would send a notification to the user here
      }
    }

    // Return success response with redirect URL
    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: qrCode.url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
