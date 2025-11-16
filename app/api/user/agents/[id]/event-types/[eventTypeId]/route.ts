import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

function getSupabaseHeaders(supabaseKey: string) {
  return {
    "Content-Type": "application/json",
    "Accept-Profile": "impaai",
    "Content-Profile": "impaai",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  }
}

async function ensureAgentOwnership(
  supabaseUrl: string,
  supabaseKey: string,
  agentId: string,
  userId: string,
) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/ai_agents?select=id&limit=1&id=eq.${agentId}&user_id=eq.${userId}`,
    { headers: getSupabaseHeaders(supabaseKey), cache: "no-store" },
  )

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Erro ao validar agente: ${response.status} - ${text}`)
  }

  const data = await response.json()
  return Array.isArray(data) && data.length > 0
}

async function fetchAgentRecord(
  supabaseUrl: string,
  supabaseKey: string,
  agentId: string,
) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/ai_agents?select=id,name,calendar_integration,calendar_provider,calendar_api_key,calendar_api_version,calendar_meeting_id&limit=1&id=eq.${agentId}`,
    { headers: getSupabaseHeaders(supabaseKey), cache: "no-store" },
  )

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Erro ao buscar agente: ${response.status} - ${text}`)
  }

  const data = await response.json()
  if (!Array.isArray(data) || data.length === 0) {
    return null
  }

  return data[0]
}

async function fetchEventTypeFromCal(
  apiKey: string,
  eventTypeId: string,
): Promise<any | null> {
  const url = new URL(`https://api.cal.com/v1/event-types/${encodeURIComponent(eventTypeId)}`)
  url.searchParams.set("apiKey", apiKey)

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Erro ao buscar event type ${eventTypeId}: ${response.status} - ${text}`)
  }

  const payload = await response.json()
  if (Array.isArray(payload)) {
    const candidate = payload[0]?.event_type ?? payload[0]
    return candidate ?? null
  }

  if (payload?.event_type) {
    return payload.event_type
  }

  return payload ?? null
}

async function fetchScheduleTimeZone(
  apiKey: string,
  scheduleId: string,
  apiVersion?: string | null,
): Promise<string | null> {
  const version = apiVersion && apiVersion.trim().length > 0 ? apiVersion : "2024-08-13"

  const response = await fetch("https://api.cal.com/v2/schedules", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": version,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Erro ao buscar schedules: ${response.status} - ${text}`)
  }

  const payload = await response.json().catch(() => null)
  if (!payload) {
    return null
  }

  const data = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []

  const schedule = data.find((item: any) => String(item?.id) === String(scheduleId))
  if (schedule) {
    return schedule?.timeZone ?? schedule?.timezone ?? null
  }

  if (payload?.data && !Array.isArray(payload.data) && String(payload.data?.id) === String(scheduleId)) {
    return payload.data?.timeZone ?? payload.data?.timezone ?? null
  }

  return null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; eventTypeId: string }> },
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id: agentIdRaw, eventTypeId: eventTypeIdRaw } = await context.params

    const agentId = String(agentIdRaw ?? "").trim()
    const eventTypeId = String(eventTypeIdRaw ?? "").trim()

    if (!agentId) {
      return NextResponse.json({ error: "Agente inválido" }, { status: 400 })
    }

    if (!eventTypeId) {
      return NextResponse.json({ error: "eventTypeId obrigatório" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase não configurado" },
        { status: 500 },
      )
    }

    const ownsAgent = await ensureAgentOwnership(
      supabaseUrl,
      supabaseKey,
      agentId,
      currentUser.id,
    )

    if (!ownsAgent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const agent = await fetchAgentRecord(supabaseUrl, supabaseKey, agentId)
    if (!agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    if (!agent.calendar_integration || agent.calendar_provider !== "calcom") {
      return NextResponse.json(
        { error: "Agente sem integração Cal.com" },
        { status: 400 },
      )
    }

    if (!agent.calendar_api_key) {
      return NextResponse.json(
        { error: "Agente sem API Key do Cal.com" },
        { status: 400 },
      )
    }

    const eventType = await fetchEventTypeFromCal(agent.calendar_api_key, eventTypeId)
    if (!eventType) {
      return NextResponse.json(
        { error: "Event type não encontrado" },
        { status: 404 },
      )
    }

    const eventTimeZone: string | null =
      eventType?.timeZone ?? eventType?.timezone ?? null
    const ownerTimeZone: string | null =
      eventType?.owner?.timeZone ?? eventType?.owner?.timezone ?? null
    const scheduleId: string | null =
      eventType?.scheduleId ?? eventType?.schedule_id ?? null

    let scheduleTimeZone: string | null = null
    if (!eventTimeZone && scheduleId) {
      try {
        scheduleTimeZone = await fetchScheduleTimeZone(
          agent.calendar_api_key,
          scheduleId,
          agent.calendar_api_version,
        )
      } catch (scheduleError) {
        console.warn(
          "[user event-type-timezone] Falha ao buscar schedule",
          scheduleId,
          scheduleError,
        )
      }
    }

    const resolved = eventTimeZone ?? scheduleTimeZone ?? ownerTimeZone ?? null

    return NextResponse.json({
      timeZone: resolved,
      eventTimeZone,
      scheduleTimeZone,
      ownerTimeZone,
      scheduleId,
      eventTypeId,
    })
  } catch (error: any) {
    console.error("Erro em GET /api/user/agents/[id]/event-types/[eventTypeId]:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error?.message ?? null },
      { status: 500 },
    )
  }
}

