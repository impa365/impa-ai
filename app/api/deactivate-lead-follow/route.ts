import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateApiKey } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const user = authResult.user

    // Obter dados do header e body
    const instanceName = request.headers.get("instance_name")
    const userIdHeader = request.headers.get("user_id")

    if (!instanceName) {
      return NextResponse.json({ error: "instance_name header is required" }, { status: 400 })
    }

    const body = await request.json()
    const { remoteJid } = body

    if (!remoteJid) {
      return NextResponse.json({ error: "remoteJid is required" }, { status: 400 })
    }

    // Determinar user_id (admin pode especificar, usuário comum usa o próprio)
    let targetUserId = user.id
    if (user.role === "admin" && userIdHeader) {
      targetUserId = userIdHeader
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    // Buscar e desativar lead
    const { data: updatedLead, error: updateError } = await supabase
      .from("lead_follow24hs")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId)
      .eq("instance_name", instanceName)
      .eq("remote_jid", remoteJid)
      .select()
      .single()

    if (updateError || !updatedLead) {
      return NextResponse.json({ error: "Lead not found or failed to deactivate" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Lead deactivated successfully",
      data: updatedLead,
    })
  } catch (error) {
    console.error("Error in deactivate-lead-follow:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
