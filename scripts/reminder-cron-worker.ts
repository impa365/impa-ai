import "dotenv/config"

import cron from "node-cron"

import { runReminderCron } from "../lib/reminders/run-reminder-cron"

const schedule = process.env.REMINDER_CRON_SCHEDULE || "* * * * *"
const dryRun = process.env.REMINDER_CRON_DRY_RUN === "1"

function log(message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  if (data) {
    console.log(`[reminder-cron][${timestamp}] ${message}`, data)
  } else {
    console.log(`[reminder-cron][${timestamp}] ${message}`)
  }
}

async function executeRun(trigger: string) {
  try {
    log(`Executando cron disparado por ${trigger}. dryRun=${dryRun}`)
    const summary = await runReminderCron({ dryRun })
    log("Execução concluída", {
      totalTriggers: summary.totalTriggers,
      remindersDue: summary.remindersDue,
      sent: summary.sent,
      failed: summary.failed,
      status: summary.details.map((detail) => ({
        triggerId: detail.triggerId,
        sent: detail.sent,
        failed: detail.failed,
        skipped: detail.skipped,
        message: detail.message,
      })),
    })
  } catch (error: any) {
    console.error(
      `[reminder-cron][${new Date().toISOString()}] Erro durante execução: ${error?.message ?? error}`,
      error,
    )
  }
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  log("⚠️  Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias para o worker.")
}

log(`Worker iniciado. Agenda: "${schedule}". Dry run: ${dryRun ? "ativo" : "desativado"}.`)

cron.schedule(
  schedule,
  () => {
    void executeRun("cron")
  },
  { timezone: process.env.REMINDER_CRON_TIMEZONE || "America/Sao_Paulo" },
)

// Executa imediatamente na inicialização (opcional)
if (process.env.REMINDER_CRON_RUN_ON_START !== "0") {
  void executeRun("startup")
}

process.on("SIGINT", () => {
  log("Encerrando worker (SIGINT)")
  process.exit(0)
})

process.on("SIGTERM", () => {
  log("Encerrando worker (SIGTERM)")
  process.exit(0)
})

