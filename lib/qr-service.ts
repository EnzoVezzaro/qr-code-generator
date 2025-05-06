import QRCode from "qrcode"
import { v4 as uuidv4 } from "uuid"
import { getSupabaseClient } from "./supabase"

export type QRCodeFormat = "svg" | "png"

export async function generateQRCode(url: string, format: QRCodeFormat = "svg") {
  try {
    if (format === "svg") {
      return await QRCode.toString(url, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "H",
      })
    } else {
      return await QRCode.toDataURL(url, {
        margin: 1,
        errorCorrectionLevel: "H",
        width: 300,
      })
    }
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}

export async function createBatch(userId: string, name: string, description?: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("batches")
    .insert({
      user_id: userId,
      name,
      description,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating batch:", error)
    throw new Error("Failed to create batch")
  }

  return data
}

export async function processUrls(userId: string, urls: string[], batchId: string) {
  const supabase = getSupabaseClient()
  const results = []

  for (const url of urls) {
    try {
      // Generate QR codes
      const svgString = await generateQRCode(url, "svg")
      const pngDataUrl = await generateQRCode(url, "png")

      // Convert PNG data URL to Blob
      const pngBase64 = pngDataUrl.split(",")[1]
      const pngBlob = base64ToBlob(pngBase64, "image/png")

      // Generate unique filenames
      const qrCodeId = uuidv4()
      const svgFilename = `${qrCodeId}.svg`
      const pngFilename = `${qrCodeId}.png`

      // Upload SVG to Supabase Storage
      const { error: svgUploadError } = await supabase.storage
        .from("qr-codes")
        .upload(`${userId}/${svgFilename}`, svgString, {
          contentType: "image/svg+xml",
          upsert: true,
        })

      if (svgUploadError) {
        throw new Error(`Failed to upload SVG: ${svgUploadError.message}`)
      }

      // Upload PNG to Supabase Storage
      const { error: pngUploadError } = await supabase.storage
        .from("qr-codes")
        .upload(`${userId}/${pngFilename}`, pngBlob, {
          contentType: "image/png",
          upsert: true,
        })

      if (pngUploadError) {
        throw new Error(`Failed to upload PNG: ${pngUploadError.message}`)
      }

      // Get public URLs for the uploaded files
      const svgPath = supabase.storage.from("qr-codes").getPublicUrl(`${userId}/${svgFilename}`).data.publicUrl
      const pngPath = supabase.storage.from("qr-codes").getPublicUrl(`${userId}/${pngFilename}`).data.publicUrl

      // Create a name for the QR code based on the URL
      let name
      try {
        const urlObj = new URL(url)
        name = `${urlObj.hostname}${urlObj.pathname.slice(0, 20)}`
      } catch {
        name = url.slice(0, 30)
      }

      // Insert QR code record into database
      const { data, error: insertError } = await supabase
        .from("qr_codes")
        .insert({
          id: qrCodeId,
          user_id: userId,
          batch_id: batchId,
          url: url,
          name: name,
          svg_path: svgPath,
          png_path: pngPath,
          status: "active",
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to insert QR code record: ${insertError.message}`)
      }

      results.push({
        success: true,
        url,
        qrCode: data,
      })
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error)
      results.push({
        success: false,
        url,
        error: error.message,
      })
    }
  }

  return results
}

// Helper function to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string) {
  const byteCharacters = atob(base64)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  return new Blob(byteArrays, { type: mimeType })
}

export async function getUserQRCodes(userId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching QR codes:", error)
    throw new Error("Failed to fetch QR codes")
  }

  return data || []
}

export async function getUserBatches(userId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("batches")
    .select("*, qr_codes(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching batches:", error)
    throw new Error("Failed to fetch batches")
  }

  return data || []
}

export async function updateQRCodeStatus(qrCodeId: string, status: "active" | "inactive") {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("qr_codes").update({ status }).eq("id", qrCodeId).select().single()

  if (error) {
    console.error("Error updating QR code status:", error)
    throw new Error("Failed to update QR code status")
  }

  return data
}

export async function deleteQRCode(qrCodeId: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("qr_codes").delete().eq("id", qrCodeId)

  if (error) {
    console.error("Error deleting QR code:", error)
    throw new Error("Failed to delete QR code")
  }

  return true
}
