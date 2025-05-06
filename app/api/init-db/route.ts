import { supabaseServer } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Execute the database schema
    const { error } = await supabaseServer.rpc("init_database_schema")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Database initialized successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
