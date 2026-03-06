import { NextResponse } from "next/server"
import { queryOne, buildUpdate } from "@/lib/db"

interface UpdateTriggerPayload {
  timingType?: string
  offsetAmount?: number
  offsetUnit?: "minutes" | "hours" | "days"
  scopeReference?: string | null
  actionType?: "webhook" | "whatsapp_message"
  webhookUrl?: string | null
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

async function ensureTriggerExistsForAgent(triggerId: string, agentId: string) {
  const trigger = await queryOne<{ id: string }>(
    `SELECT id FROM reminder_triggers WHERE id = $1 AND agent_id = $2 LIMIT 1`,
    [triggerId, agentId],
  )
  return trigger !== null
}

function buildUpdatePayload(payload: UpdateTriggerPayload) {
  const updateData: Record<string, any> = {}

  if (payload.timingType !== undefined) {
    const value = payload.timingType?.trim()
    if (!value) {
      throw new Error("timingType inválido")
    }
    updateData.timing_type = value
  }

  if (payload.offsetAmount !== undefined) {
    const offsetAmount = Number(payload.offsetAmount)
    if (!Number.isFinite(offsetAmount) || offsetAmount < 0) {
      throw new Error("offsetAmount inválido")
    }
    updateData.offset_amount = offsetAmount
  }

  if (payload.offsetUnit !== undefined) {
    if (!["minutes", "hours", "days"].includes(payload.offsetUnit)) {
      throw new Error("offsetUnit inválido")
    }
    updateData.offset_unit = payload.offsetUnit
  }

  if (payload.scopeReference !== undefined) {
    const trimmed = payload.scopeReference?.toString().trim() || null
    updateData.scope_reference = trimmed
  }

  if (payload.actionType !== undefined) {
    if (!["webhook", "whatsapp_message"].includes(payload.actionType)) {
      throw new Error("actionType inválido")
    }
    updateData.action_type = payload.actionType
  }

  if (payload.webhookUrl !== undefined) {
    const value = payload.webhookUrl
    if (value === null) {
      updateData.webhook_url = null
    } else {
      const trimmed = value.trim()
      updateData.webhook_url = trimmed.length > 0 ? trimmed : null
    }
  }

  if (payload.isActive !== undefined) {
    updateData.is_active = Boolean(payload.isActive)
  }

  if (payload.messageConfig !== undefined) {
    const config = payload.messageConfig ?? {}
    const channel: "participant" | "custom" = config.channel === "custom" ? "custom" : "participant"
    const customNumber = channel === "custom" ? sanitizePhoneNumber(config.customNumber ?? null) : null
    const templateId = config.templateId?.trim() || null
    const templateTextRaw = config.templateText ?? ""
    const templateText = templateTextRaw.trim()

    if (channel === "custom" && !customNumber) {
      throw new Error("customNumber é obrigatório quando channel=custom")
    }

    if (!templateText) {
      throw new Error("templateText é obrigatório para gatilhos WhatsApp")
    }

    updateData.action_payload = {
      version: 1,
      channel,
      customNumber,
      templateId,
      templateText: templateTextRaw,
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("Nenhuma alteração informada")
  }

  return updateData
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; triggerId: string }> }) {
  try {
    const { id: agentId, triggerId } = await context.params

    const agentExists = await ensureAgentExists(agentId)
    if (!agentExists) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const triggerExists = await ensureTriggerExistsForAgent(triggerId, agentId)
    if (!triggerExists) {
      return NextResponse.json({ error: "Gatilho não encontrado" }, { status: 404 })
    }

    const payload = (await request.json()) as UpdateTriggerPayload
    const updateData = buildUpdatePayload(payload)

    const { text, values } = buildUpdate("reminder_triggers", updateData, { id: triggerId, agent_id: agentId })
    const trigger = await queryOne(text, values)

    if (!trigger) {
      return NextResponse.json({ error: "Gatilho não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, trigger })
  } catch (error: any) {
    console.error("❌ Erro em PATCH /api/admin/agents/[id]/reminder-triggers/[triggerId]:", error)
    const message = error?.message ?? "Erro interno do servidor"
    const status = message === "Nenhuma alteração informada" || message.includes("inválido") ? 400 : 500
    return NextResponse.json({ error: "Erro ao atualizar gatilho", details: message }, { status })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; triggerId: string }> },
) {
  try {
    const { id: agentId, triggerId } = await context.params

    const agentExists = await ensureAgentExists(agentId)
    if (!agentExists) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const trigger = await queryOne(
      `DELETE FROM reminder_triggers WHERE id = $1 AND agent_id = $2 RETURNING *`,
      [triggerId, agentId],
    )

    if (!trigger) {
      return NextResponse.json({ error: "Gatilho não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Erro em DELETE /api/admin/agents/[id]/reminder-triggers/[triggerId]:", error)
    const message = error?.message ?? "Erro interno do servidor"
    return NextResponse.json({ error: "Erro ao remover gatilho", details: message }, { status: 500 })
  }
}


