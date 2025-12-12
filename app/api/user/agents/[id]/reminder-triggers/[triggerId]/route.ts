import { NextResponse } from "next/server"
import { cookies } from "next/headers"

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

const SUPABASE_HEADERS = (key: string) => ({
  "Content-Type": "application/json",
  "Accept-Profile": "impaai",
  "Content-Profile": "impaai",
  apikey: key,
  Authorization: `Bearer ${key}`,
})

async function ensureAgentOwnership(
  agentId: string,
  userId: string,
  supabaseUrl: string,
  supabaseKey: string,
) {
  const headers = SUPABASE_HEADERS(supabaseKey)
  const response = await fetch(
    `${supabaseUrl}/rest/v1/ai_agents?select=id&user_id=eq.${userId}&id=eq.${agentId}&limit=1`,
    { headers },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro ao validar agente: ${response.status} - ${errorText}`)
  }

  const agents = await response.json()
  return Array.isArray(agents) && agents.length > 0
}

async function ensureTriggerExistsForAgent(
  triggerId: string,
  agentId: string,
  supabaseUrl: string,
  supabaseKey: string,
) {
  const headers = SUPABASE_HEADERS(supabaseKey)
  const response = await fetch(
    `${supabaseUrl}/rest/v1/reminder_triggers?select=id&limit=1&id=eq.${triggerId}&agent_id=eq.${agentId}`,
    { headers },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro ao validar gatilho: ${response.status} - ${errorText}`)
  }

  const triggers = await response.json()
  return Array.isArray(triggers) && triggers.length > 0
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

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const agentId = params.id
    const triggerId = params.triggerId

    const ownsAgent = await ensureAgentOwnership(agentId, currentUser.id, supabaseUrl, supabaseKey)
    if (!ownsAgent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const triggerExists = await ensureTriggerExistsForAgent(triggerId, agentId, supabaseUrl, supabaseKey)
    if (!triggerExists) {
      return NextResponse.json({ error: "Gatilho não encontrado" }, { status: 404 })
    }

    const payload = (await request.json()) as UpdateTriggerPayload
    const updateData = buildUpdatePayload(payload)

    const headers = {
      ...SUPABASE_HEADERS(supabaseKey),
      Prefer: "return=representation",
    }

    const patchResponse = await fetch(
      `${supabaseUrl}/rest/v1/reminder_triggers?id=eq.${triggerId}&agent_id=eq.${agentId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(updateData),
      },
    )

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text()
      throw new Error(`Erro ao atualizar gatilho: ${patchResponse.status} - ${errorText}`)
    }

    const updated = await patchResponse.json()
    const trigger = Array.isArray(updated) && updated.length > 0 ? updated[0] : null

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

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const agentId = params.id
    const triggerId = params.triggerId

    const ownsAgent = await ensureAgentOwnership(agentId, currentUser.id, supabaseUrl, supabaseKey)
    if (!ownsAgent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const headers = {
      ...SUPABASE_HEADERS(supabaseKey),
      Prefer: "return=representation",
    }

    const deleteResponse = await fetch(
      `${supabaseUrl}/rest/v1/reminder_triggers?id=eq.${triggerId}&agent_id=eq.${agentId}`,
      {
        method: "DELETE",
        headers,
      },
    )

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text()
      throw new Error(`Erro ao remover gatilho: ${deleteResponse.status} - ${errorText}`)
    }

    const deleted = await deleteResponse.json()
    const trigger = Array.isArray(deleted) && deleted.length > 0 ? deleted[0] : null

    if (!trigger) {
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


