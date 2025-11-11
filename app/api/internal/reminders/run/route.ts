import { NextResponse } from "next/server"

import { requireCronSecret, runReminderCron } from "@/lib/reminders/run-reminder-cron"

export async function POST(request: Request) {
  try {
    await requireCronSecret(request)

    const dryRunHeader = request.headers.get("x-dry-run") ?? ""
    const dryRun = dryRunHeader === "1" || dryRunHeader.toLowerCase() === "true"

    const summary = await runReminderCron({ dryRun })

    return NextResponse.json({ success: true, summary })
  } catch (error: any) {
    console.error("Erro ao executar cron de lembretes:", error)
    const status = error?.message?.toLowerCase().includes("segredo") ? 401 : 500
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? "Erro interno ao executar cron de lembretes",
      },
      { status },
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}


