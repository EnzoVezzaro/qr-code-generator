import { createClient } from "@supabase/supabase-js"

// These environment variables are automatically available from the Supabase integration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for server-side usage
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey)

// For client-side usage, we need to create a new client for each request
// to avoid sharing clients between users in a production environment
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}
