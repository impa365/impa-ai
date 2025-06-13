/**
 * Script de validação de variáveis de ambiente
 *
 * Verifica se todas as variáveis necessárias estão definidas
 */

// Lista de variáveis obrigatórias
const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

console.log("🔍 Verificando variáveis de ambiente...")

// Verifica cada variável
let hasError = false

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`🚨 ERRO: ${varName} não definida!`)
    hasError = true
  } else {
    console.log(`✅ ${varName}: ${varName.includes("KEY") ? "***DEFINIDA***" : process.env[varName]}`)
  }
}

// Se alguma variável estiver faltando, encerra o processo
if (hasError) {
  console.error("\n❌ Falha na validação de ambiente. Aplicação não iniciada.")
  process.exit(1)
}

console.log("✅ Todas as variáveis de ambiente necessárias estão definidas.")
