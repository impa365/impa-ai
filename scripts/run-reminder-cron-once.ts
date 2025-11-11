import "dotenv/config"

import { runReminderCron } from "../lib/reminders/run-reminder-cron"

async function main() {
  try {
    const summary = await runReminderCron({ dryRun: false })
    console.log(JSON.stringify(summary, null, 2))
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}

void main()

