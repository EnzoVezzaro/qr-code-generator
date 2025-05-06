// This would be deployed as a Supabase Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import QRCode from "https://esm.sh/qrcode@1.5.1"
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0"

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
    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create a Supabase client with the auth header
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    })

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Parse the request body
    const { urls, batchName = `batch-${new Date().toISOString()}` } = await req.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid request body. Expected an array of URLs." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create a new batch
    const { data: batchData, error: batchError } = await supabaseClient
      .from("batches")
      .insert({
        user_id: user.id,
        name: batchName,
        description: `Batch containing ${urls.length} QR codes`,
      })
      .select()
      .single()

    if (batchError) {
      return new Response(JSON.stringify({ error: "Failed to create batch", details: batchError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const batchId = batchData.id

    // Generate QR codes for each URL
    const qrCodePromises = urls.map(async (url: string, index: number) => {
      try {
        // Generate QR code as SVG
        const svgString = await QRCode.toString(url, {
          type: "svg",
          margin: 1,
          errorCorrectionLevel: "H",
        })

        // Generate QR code as PNG data URL
        const pngDataUrl = await QRCode.toDataURL(url, {
          margin: 1,
          errorCorrectionLevel: "H",
          width: 300,
        })

        // Convert data URL to Uint8Array for storage
        const pngBase64 = pngDataUrl.split(",")[1]
        const pngBinary = atob(pngBase64)
        const pngArray = new Uint8Array(pngBinary.length)
        for (let i = 0; i < pngBinary.length; i++) {
          pngArray[i] = pngBinary.charCodeAt(i)
        }

        // Generate unique filenames
        const qrCodeId = uuidv4()
        const svgFilename = `${qrCodeId}.svg`
        const pngFilename = `${qrCodeId}.png`

        // Upload SVG to Supabase Storage
        const { error: svgUploadError } = await supabaseClient.storage
          .from("qr-codes")
          .upload(`${user.id}/${svgFilename}`, svgString, {
            contentType: "image/svg+xml",
            upsert: true,
          })

        if (svgUploadError) {
          throw new Error(`Failed to upload SVG: ${svgUploadError.message}`)
        }

        // Upload PNG to Supabase Storage
        const { error: pngUploadError } = await supabaseClient.storage
          .from("qr-codes")
          .upload(`${user.id}/${pngFilename}`, pngArray, {
            contentType: "image/png",
            upsert: true,
          })

        if (pngUploadError) {
          throw new Error(`Failed to upload PNG: ${pngUploadError.message}`)
        }

        // Get public URLs for the uploaded files
        const svgPath = supabaseClient.storage.from("qr-codes").getPublicUrl(`${user.id}/${svgFilename}`).data.publicUrl

        const pngPath = supabaseClient.storage.from("qr-codes").getPublicUrl(`${user.id}/${pngFilename}`).data.publicUrl

        // Insert QR code record into database
        const { error: insertError } = await supabaseClient.from("qr_codes").insert({
          user_id: user.id,
          batch_id: batchId,
          url: url,
          name: `QR-${index + 1}-${new URL(url).hostname}`,
          svg_path: svgPath,
          png_path: pngPath,
          status: "active",
        })

        if (insertError) {
          throw new Error(`Failed to insert QR code record: ${insertError.message}`)
        }

        return {
          url,
          svgPath,
          pngPath,
        }
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error)
        return {
          url,
          error: error.message,
        }
      }
    })

    const results = await Promise.all(qrCodePromises)

    return new Response(
      JSON.stringify({
        success: true,
        batchId,
        results,
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
