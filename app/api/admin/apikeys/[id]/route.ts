import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error } = await supabase.from("user_api_keys").delete().eq("id", params.id)

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
