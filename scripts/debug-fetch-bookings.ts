import { randomUUID } from "crypto"

import { fileURLToPath } from "url"
import { dirname } from "path"

import { createRequire } from "module"

const require = createRequire(import.meta.url)

const { fetch } = require("undici")

global.fetch = fetch
global.crypto = { randomUUID }

const moduleUrl = new URL("../lib/reminders/run-reminder-cron.ts", import.meta.url)
const modulePath = fileURLToPath(moduleUrl)

const scriptDir = dirname(modulePath)

async function main() {
  const { default: runModule } = await import(moduleUrl.toString())
  console.log(runModule)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

