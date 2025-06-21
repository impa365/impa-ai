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

    if (!remoteJid || !name || !dia) {
      return NextResponse.json({ error: "remoteJid, name, and dia are required" }, { status: 400 })
    }

    // Validar formato da data
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/
    if (!dateRegex.test(dia)) {
      return NextResponse.json({ error: "dia must be in format DD/MM/YYYY" }, { status: 400 })
    }

    // Converter data para formato ISO
    const [day, month, year] = dia.split("/")
    const startDate = new Date(`${year}-${month}-${day}`)

    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
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
            start_date: startDate.toISOString().split("T")[0],
            current_day: 1,
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
        start_date: startDate.toISOString().split("T")[0],
        current_day: 1,
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
