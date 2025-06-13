// scripts/check-env.js
console.log("--- Manual Environment Check ---")

const varsToCheck = [
  "NODE_ENV",
  "PORT",
  "HOSTNAME",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY", // Se você usa
]

varsToCheck.forEach((varName) => {
  const value = process.env[varName]
  if (value) {
    // Para URLs, mostrar o valor completo para diagnóstico
    const displayValue = varName.includes("KEY") && !varName.includes("URL") ? "***HIDDEN***" : value
    console.log(`✅ ${varName}: ${displayValue}`)
  } else {
    console.log(`❌ ${varName}: NOT SET`)
  }
})

console.log("------------------------------")
