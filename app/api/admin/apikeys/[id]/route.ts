import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "API Key ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    const { error } = await supabase.from("user_api_keys").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting API key:", error)
      return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 })
    }

    return NextResponse.json({ message: "API Key deleted successfully" })
  } catch (error: any) {
    console.error("❌ API Route Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
