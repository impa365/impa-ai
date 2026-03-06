import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { queryOne } from "@/lib/db"

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

    updateData.action_payload = JSON.stringify({
      version: 1,
      channel,
      customNumber,
      templateId,
      templateText: templateTextRaw,
    })
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("Nenhuma alteração informada")
  }

  return updateData
}

async function getCurrentUser() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get("impaai_user")

  if (!userCookie) {
    return null
  }

  try {
    return JSON.parse(userCookie.value)
  } catch (error) {
    return null
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; triggerId: string }> }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: agentId, triggerId } = await params

    const agent = await queryOne(
      "SELECT id FROM ai_agents WHERE id = $1 AND user_id = $2",
      [agentId, currentUser.id],
    )

    if (!agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const triggerExists = await queryOne(
      "SELECT id FROM reminder_triggers WHERE id = $1 AND agent_id = $2",
      [triggerId, agentId],
    )

    if (!triggerExists) {
      return NextResponse.json({ error: "Gatilho não encontrado" }, { status: 404 })
    }

    const payload = (await request.json()) as UpdateTriggerPayload
    const updateData = buildUpdatePayload(payload)

    // Build dynamic UPDATE query
    const keys = Object.keys(updateData)
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`)
    const values = keys.map((key) => updateData[key])
    const paramOffset = keys.length

    const trigger = await queryOne(
      `UPDATE reminder_triggers SET ${setClauses.join(", ")} WHERE id = $${paramOffset + 1} AND agent_id = $${paramOffset + 2} RETURNING *`,
      [...values, triggerId, agentId],
    )

    if (!trigger) {
      return NextResponse.json({ error: "Gatilho não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, trigger })
  } catch (error: any) {
    console.error("❌ Erro em PATCH /api/user/agents/[id]/reminder-triggers/[triggerId]:", error)
    const message = error?.message ?? "Erro interno do servidor"
    const status =
      message === "Nenhuma alteração informada" || message.includes("inválido")
        ? 400
        : message.includes("Não autorizado")
          ? 401
          : 500
    return NextResponse.json({ error: "Erro ao atualizar gatilho", details: message }, { status })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; triggerId: string }> }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: agentId, triggerId } = await params

    const agent = await queryOne(
      "SELECT id FROM ai_agents WHERE id = $1 AND user_id = $2",
      [agentId, currentUser.id],
    )

    if (!agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const deleted = await queryOne(
      "DELETE FROM reminder_triggers WHERE id = $1 AND agent_id = $2 RETURNING *",
      [triggerId, agentId],
    )

    if (!deleted) {
      return NextResponse.json({ error: "Gatilho não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Erro em DELETE /api/user/agents/[id]/reminder-triggers/[triggerId]:", error)
    const message = error?.message ?? "Erro interno do servidor"
    const status =
      message.includes("Não autorizado") ? 401 : message.includes("Agente não encontrado") ? 404 : 500
    return NextResponse.json({ error: "Erro ao remover gatilho", details: message }, { status })
  }
}


