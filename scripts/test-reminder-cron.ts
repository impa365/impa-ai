import { runReminderCron } from "../lib/reminders/run-reminder-cron"

type FetchInput = Parameters<typeof fetch>[0]
type FetchInit = Parameters<typeof fetch>[1]

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/postgres"
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

// NOTE: run-reminder-cron.ts now uses direct SQL via @/lib/db instead of Supabase REST API.
// This test script's fetch mocks only cover external API calls (e.g. Cal.com).
// To fully test, mock the db module or use a real test database.

// @ts-ignore - override global fetch with mock
global.fetch = async (input: FetchInput, init?: FetchInit) => {
  const url = typeof input === "string" ? input : input.toString()

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

