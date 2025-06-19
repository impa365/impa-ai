import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

// Create admin Supabase client with service role key
function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🗑️ [API Keys] Starting deletion for ID:", params.id)

    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      console.log("❌ [API Keys] Unauthorized delete attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminSupabaseClient()

    const { error } = await supabase.from("user_api_keys").delete().eq("id", params.id)

    if (error) {
      console.error("❌ [API Keys] Error deleting API key:", error)
      return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 })
    }

    console.log("✅ [API Keys] API key deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ [API Keys] Unexpected error in deletion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
