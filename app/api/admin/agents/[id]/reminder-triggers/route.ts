import { NextResponse } from "next/server"
import { queryOne, queryMany, buildInsert } from "@/lib/db"

interface CreateTriggerPayload {
  timingType?: string
  offsetAmount?: number
  offsetUnit?: "minutes" | "hours" | "days"
  scopeType?: "agent" | "calendar" | "event_type"
  scopeReference?: string | null
  actionType?: "webhook" | "whatsapp_message"
  webhookUrl?: string
  isActive?: boolean
  messageConfig?: {
    channel?: "participant" | "custom"
    customNumber?: string | null
    templateId?: string | null
    templateText?: string | null
  }
}

const sanitizePhoneNumber = (value?: string | null): string | null => {
  if (!value) {
    return null
  }
  const digits = String(value).replace(/\D+/g, "")
  return digits.length > 0 ? digits : null
}

async function ensureAgentExists(agentId: string) {
  const agent = await queryOne<{ id: string }>(
    `SELECT id FROM ai_agents WHERE id = $1 LIMIT 1`,
    [agentId],
  )
  return agent !== null
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await context.params

    const exists = await ensureAgentExists(agentId)
    if (!exists) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const triggers = await queryMany(
      `SELECT * FROM reminder_triggers WHERE agent_id = $1 ORDER BY created_at DESC`,
      [agentId],
    )

    return NextResponse.json({ success: true, triggers })
  } catch (error: any) {
    console.error("❌ Erro em GET /api/admin/agents/[id]/reminder-triggers:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error?.message ?? "" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await context.params

    const exists = await ensureAgentExists(agentId)
    if (!exists) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const payload: CreateTriggerPayload = await request.json()

    const offsetAmount = Number(payload.offsetAmount)
    const offsetUnit = payload.offsetUnit ?? "minutes"
    const rawWebhookUrl = payload.webhookUrl?.trim()
    const timingType = payload.timingType ?? "before_event_start"
    const scopeType = payload.scopeType ?? "agent"
    const scopeReference = payload.scopeReference?.trim() || null
    const actionType = payload.actionType ?? "webhook"
    const isActive = payload.isActive ?? true

    if (!Number.isFinite(offsetAmount) || offsetAmount < 0) {
      return NextResponse.json({ error: "offsetAmount inválido" }, { status: 400 })
    }

    if (!["minutes", "hours", "days"].includes(offsetUnit)) {
      return NextResponse.json({ error: "offsetUnit inválido" }, { status: 400 })
    }

    if (!timingType) {
      return NextResponse.json({ error: "timingType é obrigatório" }, { status: 400 })
    }

    if (!["agent", "calendar", "event_type"].includes(scopeType)) {
      return NextResponse.json({ error: "scopeType inválido" }, { status: 400 })
    }

    if (!["webhook", "whatsapp_message"].includes(actionType)) {
      return NextResponse.json({ error: "actionType inválido" }, { status: 400 })
    }

    let webhookUrl: string | null = null
    let actionPayload: Record<string, any> = {}

    if (actionType === "webhook") {
      webhookUrl = rawWebhookUrl ?? ""
      if (!webhookUrl) {
        return NextResponse.json({ error: "webhookUrl é obrigatório para webhooks" }, { status: 400 })
      }
    } else {
      const messageConfig = payload.messageConfig ?? {}
      const channel: "participant" | "custom" = messageConfig.channel === "custom" ? "custom" : "participant"
      const customNumber = channel === "custom" ? sanitizePhoneNumber(messageConfig.customNumber ?? null) : null
      const templateId = messageConfig.templateId?.trim() || null
      const templateTextRaw = messageConfig.templateText ?? ""
      const templateText = templateTextRaw.trim()

      if (channel === "custom" && !customNumber) {
        return NextResponse.json({ error: "customNumber é obrigatório quando channel=custom" }, { status: 400 })
      }

      if (!templateText) {
        return NextResponse.json({ error: "templateText é obrigatório para gatilhos WhatsApp" }, { status: 400 })
      }

      actionPayload = {
        version: 1,
        channel,
        customNumber,
        templateId,
        templateText: templateTextRaw,
      }
    }

    const insertData = {
      agent_id: agentId,
      timing_type: timingType,
      offset_amount: offsetAmount,
      offset_unit: offsetUnit,
      scope_type: scopeType,
      scope_reference: scopeReference,
      action_type: actionType,
      webhook_url: webhookUrl,
      action_payload: actionPayload,
      is_active: isActive,
    }

    const { text, values } = buildInsert("reminder_triggers", insertData)
    const created = await queryOne(text, values)

    if (!created) {
      return NextResponse.json({ error: "Erro ao criar gatilho" }, { status: 500 })
    }

    return NextResponse.json({ success: true, trigger: created })
  } catch (error: any) {
    console.error("❌ Erro em POST /api/admin/agents/[id]/reminder-triggers:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error?.message ?? "" },
      { status: 500 },
    )
  }
}

