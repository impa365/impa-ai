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
    const { remoteJid, name, dia } = body

    if (!remoteJid || !name || dia === undefined) {
      return NextResponse.json({ error: "remoteJid, name, and dia are required" }, { status: 400 })
    }

    // Validar que dia é um número válido (1-30)
    const dayNumber = Number.parseInt(dia.toString())
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json({ error: "dia must be a number between 1 and 30" }, { status: 400 })
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

    // Verificar se o lead já existe
    const { data: existingLead } = await supabase
      .from("lead_follow24hs")
      .select("id, is_active")
      .eq("user_id", targetUserId)
      .eq("instance_name", instanceName)
      .eq("remote_jid", remoteJid)
      .single()

    if (existingLead) {
      if (existingLead.is_active) {
        return NextResponse.json({ error: "Lead already exists and is active" }, { status: 409 })
      } else {
        // Reativar lead existente
        const { data: updatedLead, error: updateError } = await supabase
          .from("lead_follow24hs")
          .update({
            name,
            start_date: new Date().toISOString().split("T")[0], // Data atual
            current_day: dayNumber,
            is_active: true,
            last_message_sent_day: 0,
            last_message_sent_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLead.id)
          .select()
          .single()

        if (updateError) {
          console.error("Error reactivating lead:", updateError)
          return NextResponse.json({ error: "Failed to reactivate lead" }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "Lead reactivated successfully",
          data: updatedLead,
        })
      }
    }

    // Criar novo lead
    const { data: newLead, error: insertError } = await supabase
      .from("lead_follow24hs")
      .insert({
        user_id: targetUserId,
        instance_name: instanceName,
        remote_jid: remoteJid,
        name,
        start_date: new Date().toISOString().split("T")[0], // Data atual
        current_day: dayNumber,
        is_active: true,
        last_message_sent_day: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating lead:", insertError)
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Lead added successfully",
      data: newLead,
    })
  } catch (error) {
    console.error("Error in add-lead-follow:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
