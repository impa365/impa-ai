import "dotenv/config"

import { runReminderCron } from "../lib/reminders/run-reminder-cron"

async function main() {
  const summary = await runReminderCron({ dryRun: false })
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

