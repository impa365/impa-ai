import { NextResponse } from "next/server"
import { queryMany } from "@/lib/db"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await context.params
    const requestUrl = new URL(request.url)

    // Get trigger IDs for this agent
    const triggerRows = await queryMany<{ id: string; is_active: boolean }>(
      `SELECT id, is_active FROM reminder_triggers WHERE agent_id = $1`,
      [agentId],
    )

    const triggerIds: string[] = triggerRows
      .filter((t) => t?.id)
      .map((t) => String(t.id))

    if (triggerIds.length === 0) {
      return NextResponse.json({ success: true, logs: {} })
    }

    const bookingParam = requestUrl.searchParams.get("bookingUid") ?? ""
    const bookingUids = bookingParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)

    // Build query for logs
    let sql = `
      SELECT trigger_id, booking_uid, scheduled_for, executed_at, success, webhook_status, error_message
      FROM reminder_trigger_logs
      WHERE trigger_id = ANY($1)
    `
    const params: any[] = [triggerIds]

    if (bookingUids.length > 0) {
      sql += ` AND booking_uid = ANY($2)`
      params.push(bookingUids)
    }

    sql += ` ORDER BY scheduled_for DESC`

    const rows = await queryMany(sql, params)

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

    // Sort each log list by executedAt desc
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

