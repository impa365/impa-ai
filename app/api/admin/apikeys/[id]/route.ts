// Novo arquivo
import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase"
import { getCurrentUserFromSession } from "@/lib/auth"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserFromSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKeyId = params.id
    if (!apiKeyId) {
      return NextResponse.json({ error: "API Key ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()
    const { error } = await supabase.from("user_api_keys").delete().eq("id", apiKeyId)

    if (error) {
      console.error(`API Error deleting API key ${apiKeyId}:`, error.message)
      return NextResponse.json({ error: "Failed to delete API key", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "API Key deleted successfully" })
  } catch (error: any) {
    console.error("API Route Error deleting API key:", error.message)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
