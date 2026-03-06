import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { queryOne, queryMany } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params

    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const agent = await queryOne(
      "SELECT id FROM ai_agents WHERE id = $1 AND user_id = $2",
      [agentId, currentUser.id],
    )

    if (!agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const triggerRows = await queryMany<{ id: string; is_active: boolean }>(
      "SELECT id, is_active FROM reminder_triggers WHERE agent_id = $1",
      [agentId],
    )

    const triggerIds: string[] = triggerRows
      .filter((trigger) => trigger?.id)
      .map((trigger) => String(trigger.id))

    if (triggerIds.length === 0) {
      return NextResponse.json({ success: true, logs: {} })
    }

    const requestUrl = new URL(request.url)
    const bookingParam = requestUrl.searchParams.get("bookingUid") ?? ""
    const bookingUids = bookingParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)

    // Build parameterized query for trigger_id IN (...) and optional booking_uid IN (...)
    const queryParams: any[] = []
    const triggerPlaceholders = triggerIds.map((id, i) => {
      queryParams.push(id)
      return `$${i + 1}`
    })

    let sql = `SELECT trigger_id, booking_uid, scheduled_for, executed_at, success, webhook_status, error_message
               FROM reminder_trigger_logs
               WHERE trigger_id IN (${triggerPlaceholders.join(",")})`

    if (bookingUids.length > 0) {
      const bookingPlaceholders = bookingUids.map((uid, i) => {
        queryParams.push(uid)
        return `$${triggerIds.length + i + 1}`
      })
      sql += ` AND booking_uid IN (${bookingPlaceholders.join(",")})`
    }

    sql += ` ORDER BY scheduled_for DESC`

    const rows = await queryMany(sql, queryParams)

    const grouped: Record<string, Record<string, any[]>> = {}

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
    console.error("❌ Erro em GET /api/user/agents/[id]/reminder-trigger-logs:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error?.message ?? "" },
      { status: 500 },
    )
  }
}

