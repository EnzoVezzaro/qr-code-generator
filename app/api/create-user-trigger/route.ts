import { supabaseServer } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create a trigger to automatically create a user record when a new user signs up
    const { error } = await supabaseServer.rpc("create_auth_trigger")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Auth trigger created successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
