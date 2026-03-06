import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { queryOne } from "@/lib/db"

const DEFAULT_V2_HEADER_VERSION = "2024-08-13"

interface CalcomBookingResponseV2 {
  status?: string
  data?: any[]
  error?: any
}

interface CalcomBookingResponseV1 {
  bookings?: any[]
  error?: any
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: agentId } = await context.params

  try {
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
      "SELECT * FROM ai_agents WHERE id = $1 AND user_id = $2",
      [agentId, currentUser.id],
    )

    if (!agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    if (!agent.calendar_integration) {
      return NextResponse.json({ error: "Agente não possui integração de calendário ativa" }, { status: 400 })
    }

    if (agent.calendar_provider !== "calcom") {
      return NextResponse.json({ error: "Integração de calendário não compatível" }, { status: 400 })
    }

    if (!agent.calendar_api_key) {
      return NextResponse.json({ error: "Agente sem Cal.com API key configurada" }, { status: 400 })
    }

    const rawVersion: string = agent.calendar_api_version || "v1"
    const normalizedVersion = rawVersion.toLowerCase()

    let baseUrl: string = agent.calendar_api_url
      ? String(agent.calendar_api_url)
      : normalizedVersion.startsWith("v2")
        ? "https://api.cal.com/v2"
        : "https://api.cal.com/v1"

    baseUrl = baseUrl.replace(/\/+$/, "")

    const requestUrl = new URL(request.url)
    const calUrl = new URL(`${baseUrl}/bookings`)

    const calendarMeetingId = agent.calendar_meeting_id

    const statusFilter = (requestUrl.searchParams.get("status") ?? "ACCEPTED").toUpperCase()
    const now = Date.now()
    requestUrl.searchParams.delete("status")

    // Propagar demais parâmetros de consulta recebidos (exceto status)
    requestUrl.searchParams.forEach((value, key) => {
      if (value !== undefined && value !== null && value !== "") {
        calUrl.searchParams.set(key, value)
      }
    })

    const calHeaders: Record<string, string> = {
      Accept: "application/json",
    }

    if (normalizedVersion.startsWith("v2")) {
      calHeaders.Authorization = `Bearer ${agent.calendar_api_key}`

      // Permitir sobrescrever o header via query (?calApiVersion=YYYY-MM-DD)
      const explicitVersion = requestUrl.searchParams.get("calApiVersion")
      const headerValue = explicitVersion || (rawVersion.match(/^\d{4}-\d{2}-\d{2}$/) ? rawVersion : DEFAULT_V2_HEADER_VERSION)
      calHeaders["cal-api-version"] = headerValue
    } else {
      // v1 ainda depende de apiKey na query string
      calUrl.searchParams.set("apiKey", agent.calendar_api_key)
    }

    const calResponse = await fetch(calUrl.toString(), {
      headers: calHeaders,
      cache: "no-store",
    })

    if (!calResponse.ok) {
      const errorText = await calResponse.text()
      console.error("❌ Erro Cal.com:", calResponse.status, errorText)
      return NextResponse.json(
        {
          error: "Falha ao consultar Cal.com",
          status: calResponse.status,
          details: errorText,
        },
        { status: calResponse.status },
      )
    }

    const data = await calResponse.json()
    let bookings: any[] = []

    const dataV2 = data as CalcomBookingResponseV2
    const dataV1 = data as CalcomBookingResponseV1

    if (Array.isArray(dataV2?.data)) {
      bookings = dataV2.data
    } else if (Array.isArray(dataV1?.bookings)) {
      bookings = dataV1.bookings
    }

    if (calendarMeetingId) {
      const idNormalized = calendarMeetingId.trim().toLowerCase()
      bookings = bookings.filter((booking: any) => {
        const candidates = [
          booking?.uid,
          booking?.id,
          booking?.eventTypeId,
          booking?.eventType?.id,
          booking?.calendarEventId,
          booking?.metadata?.calendarId,
        ]
          .map((value) => (value !== undefined && value !== null ? String(value).trim().toLowerCase() : null))
          .filter(Boolean)

        return candidates.includes(idNormalized)
      })
    }

    if (statusFilter !== "ALL") {
      const expected = statusFilter.toUpperCase()
      bookings = bookings.filter((booking: any) => String(booking?.status ?? "").toUpperCase() === expected)
    }

    bookings = bookings.filter((booking: any) => {
      const start = booking?.start ?? booking?.startTime
      if (!start) return true
      const date = new Date(start)
      return !Number.isNaN(date.valueOf()) && date.getTime() >= now
    })

    return NextResponse.json({
      success: true,
      provider: agent.calendar_provider,
      version: normalizedVersion.startsWith("v2") ? "v2" : "v1",
      source: data,
      bookings,
    })
  } catch (error: any) {
    console.error("❌ Erro em GET /api/user/agents/[id]/bookings:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error?.message || "",
      },
      { status: 500 },
    )
  }
}

