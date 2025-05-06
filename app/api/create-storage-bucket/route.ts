import { supabaseServer } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create a storage bucket for QR codes if it doesn't exist
    const { data, error } = await supabaseServer.storage.createBucket("qr-codes", {
      public: true,
      fileSizeLimit: 1024 * 1024, // 1MB
      allowedMimeTypes: ["image/svg+xml", "image/png"],
    })

    if (error && error.message !== "Bucket already exists") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Storage bucket created or already exists" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
