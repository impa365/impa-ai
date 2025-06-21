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
    const { remoteJid, name, dia, currentDay, markDayAsSent } = body

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

    // Buscar lead existente
    const { data: existingLead, error: findError } = await supabase
      .from("lead_follow24hs")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("instance_name", instanceName)
      .eq("remote_jid", remoteJid)
      .single()

    if (findError || !existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name) updateData.name = name

    if (dia) {
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

      updateData.start_date = startDate.toISOString().split("T")[0]
    }

    if (currentDay !== undefined) {
      updateData.current_day = currentDay
    }

    // Marcar dia como enviado
    if (markDayAsSent !== undefined) {
      updateData.last_message_sent_day = markDayAsSent
      updateData.last_message_sent_at = new Date().toISOString()

      // Buscar configuração de mensagem para este dia
      const { data: followupConfig } = await supabase
        .from("followup_24hs")
        .select("id")
        .eq("user_id", targetUserId)
        .eq("instance_name", instanceName)
        .single()

      if (followupConfig) {
        const { data: messageConfig } = await supabase
          .from("followup_messages")
          .select("*")
          .eq("followup_config_id", followupConfig.id)
          .eq("day_number", markDayAsSent)
          .single()

        if (messageConfig) {
          // Registrar no histórico
          await supabase.from("followup_message_history").upsert({
            lead_id: existingLead.id,
            day_number: markDayAsSent,
            message_text: messageConfig.message_text,
            media_url: messageConfig.media_url,
            media_type: messageConfig.media_type,
            sent_at: new Date().toISOString(),
            status: "sent",
          })
        }
      }
    }

    // Atualizar lead
    const { data: updatedLead, error: updateError } = await supabase
      .from("lead_follow24hs")
      .update(updateData)
      .eq("id", existingLead.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating lead:", updateError)
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead,
    })
  } catch (error) {
    console.error("Error in update-lead-follow:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
