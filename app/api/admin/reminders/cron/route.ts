import { NextResponse } from "next/server"
import cronParser from "cron-parser"

const DEFAULT_SCHEDULE = "* * * * *"
const DEFAULT_TIMEZONE = "America/Sao_Paulo"

const SUPABASE_HEADERS = (key: string) => ({
  "Content-Type": "application/json",
  "Accept-Profile": "impaai",
  "Content-Profile": "impaai",
  apikey: key,
  Authorization: `Bearer ${key}`,
})

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const schedule = process.env.REMINDER_CRON_SCHEDULE || DEFAULT_SCHEDULE
    const timezone = process.env.REMINDER_CRON_TIMEZONE || DEFAULT_TIMEZONE
    const dryRun = process.env.REMINDER_CRON_DRY_RUN === "1"

    const headers = SUPABASE_HEADERS(supabaseKey)
    const runsResponse = await fetch(
      `${supabaseUrl}/rest/v1/reminder_cron_runs?select=*&order=started_at.desc&limit=5`,
      { headers, cache: "no-store" },
    )

    if (!runsResponse.ok) {
      const errorText = await runsResponse.text()
      throw new Error(`Erro ao buscar histórico do cron: ${runsResponse.status} - ${errorText}`)
    }

    const runsData = await runsResponse.json()

    const lastRuns = Array.isArray(runsData)
      ? runsData.map((run: any) => ({
          id: String(run?.id ?? ""),
          startedAt: run?.started_at ?? null,
          finishedAt: run?.finished_at ?? null,
          durationMs: typeof run?.duration_ms === "number" ? run.duration_ms : null,
          success: typeof run?.success === "boolean" ? run.success : null,
          dryRun: Boolean(run?.dry_run),
          remindersDue: Number(run?.reminders_due ?? 0),
          remindersSent: Number(run?.reminders_sent ?? 0),
          remindersFailed: Number(run?.reminders_failed ?? 0),
          triggersProcessed: Number(run?.triggers_processed ?? 0),
          message: run?.message ?? null,
        }))
      : []

    const nextRuns: string[] = []
    try {
      const interval = cronParser.parse(schedule, {
        tz: timezone,
        currentDate: new Date(),
      })
      for (let index = 0; index < 5; index += 1) {
        nextRuns.push(interval.next().toISOString())
      }
    } catch (errorWithTz) {
      console.error("Erro ao calcular próximos horários do cron (com timezone)", errorWithTz)
      try {
        const fallbackInterval = cronParser.parse(schedule, {
          currentDate: new Date(),
        })
        for (let index = 0; index < 5; index += 1) {
          nextRuns.push(fallbackInterval.next().toISOString())
        }
      } catch (fallbackError) {
        console.error("Erro ao calcular próximos horários do cron (fallback)", fallbackError)
      }
    }

    return NextResponse.json({
      success: true,
      schedule,
      timezone,
      dryRun,
      serverTime: new Date().toISOString(),
      lastRuns,
      nextRuns,
    })
  } catch (error: any) {
    console.error("❌ Erro em GET /api/admin/reminders/cron:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor", details: error?.message ?? "" },
      { status: 500 },
    )
  }
}

