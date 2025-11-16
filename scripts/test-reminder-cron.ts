import { runReminderCron } from "../lib/reminders/run-reminder-cron"

type FetchInput = Parameters<typeof fetch>[0]
type FetchInit = Parameters<typeof fetch>[1]

process.env.SUPABASE_URL = "https://supabase.local"
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key"
process.env.REMINDER_CRON_SECRET = "secret"

function jsonResponse(body: any, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  })
}

function textResponse(text: string, init: ResponseInit = { status: 200 }) {
  return new Response(text, {
    headers: { "Content-Type": "text/plain" },
    ...init,
  })
}

// @ts-ignore - override global fetch with mock
global.fetch = async (input: FetchInput, init?: FetchInit) => {
  const url = typeof input === "string" ? input : input.toString()

  if (url.includes("/rest/v1/reminder_triggers")) {
    if (init?.method === "POST") {
      return textResponse("", { status: 201 })
    }

    return jsonResponse([
      {
        id: "trigger-1",
        agent_id: "agent-1",
        offset_amount: 1,
        offset_unit: "hours",
        webhook_url: "https://webhook.test/reminder",
        scope_reference: "event-type-123",
        is_active: true,
      },
    ])
  }

  if (url.includes("/rest/v1/reminder_trigger_logs")) {
    if (init?.method === "POST") {
      return textResponse("", { status: 201 })
    }

    return jsonResponse([])
  }

  if (url.includes("/rest/v1/ai_agents")) {
    return jsonResponse([
      {
        id: "agent-1",
        name: "Agente Teste",
        user_id: "user-1",
        calendar_provider: "cal.com",
        calendar_api_key: "cal-key",
        calendar_api_url: "https://api.cal.com/v2",
        calendar_api_version: "v2",
        calendar_meeting_id: "event-type-123",
      },
    ])
  }

  if (url.includes("api.cal.com")) {
    const now = Date.now()
    const start = new Date(now + 60 * 60 * 1000).toISOString()
    const end = new Date(now + 90 * 60 * 1000).toISOString()

    return jsonResponse({
      status: "success",
      data: [
        {
          id: 1001,
          uid: "booking-uid-1",
          title: "Consulta de Teste",
          status: "accepted",
          start,
          end,
          attendees: [
            {
              name: "Fulano",
              email: "fulano@example.com",
              timeZone: "America/Sao_Paulo",
              phoneNumber: "+5511912345678",
            },
          ],
          hosts: [
            {
              name: "Agente Teste",
              email: "agente@example.com",
            },
          ],
          responses: {
            attendeePhoneNumber: "+5511912345678",
          },
        },
      ],
    })
  }

  console.warn("Unhandled fetch request:", url, init)
  return textResponse("", { status: 404 })
}

async function main() {
  const summary = await runReminderCron({ dryRun: true })
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error("Erro no teste do cron:", error)
  process.exitCode = 1
})

