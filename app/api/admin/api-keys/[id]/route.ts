import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

// Create Supabase client for API routes
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "API Key ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("user_api_keys").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting API key:", error)
      return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error in delete API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
