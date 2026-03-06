import { NextResponse } from "next/server"
import cronParser from "cron-parser"
import { queryMany } from "@/lib/db"

const DEFAULT_SCHEDULE = "* * * * *"
const DEFAULT_TIMEZONE = "America/Sao_Paulo"

export async function GET() {
  try {
    const schedule = process.env.REMINDER_CRON_SCHEDULE || DEFAULT_SCHEDULE
    const timezone = process.env.REMINDER_CRON_TIMEZONE || DEFAULT_TIMEZONE
    const dryRun = process.env.REMINDER_CRON_DRY_RUN === "1"

    const runsData = await queryMany(
      `SELECT * FROM reminder_cron_runs ORDER BY started_at DESC LIMIT 5`
    )

    const lastRuns = runsData.map((run: any) => ({
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

