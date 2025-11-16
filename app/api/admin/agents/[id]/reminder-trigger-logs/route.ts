import { NextResponse } from "next/server"

const SUPABASE_HEADERS = (key: string) => ({
  "Content-Type": "application/json",
  "Accept-Profile": "impaai",
  "Content-Profile": "impaai",
  apikey: key,
  Authorization: `Bearer ${key}`,
})

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await context.params
    const requestUrl = new URL(request.url)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = SUPABASE_HEADERS(supabaseKey)

    const triggersResponse = await fetch(
      `${supabaseUrl}/rest/v1/reminder_triggers?agent_id=eq.${agentId}&select=id,is_active`,
      { headers },
    )

    if (!triggersResponse.ok) {
      const errorText = await triggersResponse.text()
      throw new Error(`Erro ao buscar gatilhos: ${triggersResponse.status} - ${errorText}`)
    }

    const triggerRows = await triggersResponse.json()
    const triggerIds: string[] = Array.isArray(triggerRows)
      ? triggerRows.filter((trigger: any) => trigger?.id).map((trigger: any) => String(trigger.id))
      : []

    if (triggerIds.length === 0) {
      return NextResponse.json({ success: true, logs: {} })
    }

    const bookingParam = requestUrl.searchParams.get("bookingUid") ?? ""
    const bookingUids = bookingParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)

    const logsUrl = new URL(`${supabaseUrl}/rest/v1/reminder_trigger_logs`)
    logsUrl.searchParams.set(
      "select",
      "trigger_id,booking_uid,scheduled_for,executed_at,success,webhook_status,error_message",
    )
    logsUrl.searchParams.set("order", "scheduled_for.desc")
    logsUrl.searchParams.set("trigger_id", `in.(${triggerIds.join(",")})`)

    if (bookingUids.length > 0) {
      const serialized = bookingUids.map((uid) => `"${uid.replace(/"/g, '""')}"`).join(",")
      logsUrl.searchParams.set("booking_uid", `in.(${serialized})`)
    }

    const logsResponse = await fetch(logsUrl.toString(), { headers })
    if (!logsResponse.ok) {
      const errorText = await logsResponse.text()
      throw new Error(`Erro ao buscar logs: ${logsResponse.status} - ${errorText}`)
    }

    const rows = await logsResponse.json()
    const grouped: Record<string, Record<string, any[]>> = {}

    if (Array.isArray(rows)) {
      for (const row of rows) {
        const bookingUid = String(row?.booking_uid ?? "")
        const triggerId = String(row?.trigger_id ?? "")
        if (!bookingUid || !triggerId) continue

        if (!grouped[bookingUid]) {
          grouped[bookingUid] = {}
        }
        if (!grouped[bookingUid][triggerId]) {
          grouped[bookingUid][triggerId] = []
        }

        grouped[bookingUid][triggerId].push({
          triggerId,
          bookingUid,
          scheduledFor: row?.scheduled_for ?? null,
          executedAt: row?.executed_at ?? null,
          success: row?.success ?? false,
          webhookStatus: row?.webhook_status ?? null,
          errorMessage: row?.error_message ?? null,
        })
      }
    }

    // Ordena cada lista de logs por executedAt desc
    for (const bookingUid of Object.keys(grouped)) {
      for (const triggerId of Object.keys(grouped[bookingUid])) {
        grouped[bookingUid][triggerId].sort((a, b) => {
          const dateA = a.executedAt ? new Date(a.executedAt).getTime() : 0
          const dateB = b.executedAt ? new Date(b.executedAt).getTime() : 0
          return dateB - dateA
        })
      }
    }

    return NextResponse.json({ success: true, logs: grouped })
  } catch (error: any) {
    console.error("❌ Erro em GET /api/admin/agents/[id]/reminder-trigger-logs:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error?.message ?? "" },
      { status: 500 },
    )
  }
}

