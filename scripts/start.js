/**
 * Script de inicialização da aplicação - APENAS SERVIDOR
 * Valida variáveis de AMBIENTE (runtime)
 */

const { spawn } = require("child_process")

console.log("🚀 Iniciando script de start.js...")

// Estas são as variáveis que o SERVIDOR precisa para funcionar
// e para servir a configuração para o cliente via /api/config
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL", // Necessária para o /api/config
  "NEXT_PUBLIC_SUPABASE_ANON_KEY", // Necessária para o /api/config
  "PORT",
  // Adicione outras variáveis de runtime que são cruciais para o servidor
  // "SUPABASE_SERVICE_ROLE_KEY", // Se usada pelo servidor
]

let allVarsPresent = true

console.log("🔍 Validando variáveis de ambiente de RUNTIME (esperadas do Portainer)...")
for (const varName of REQUIRED_ENV_VARS) {
  const value = process.env[varName]
  if (!value) {
    console.error(`🚨 ERRO DE RUNTIME: Variável de ambiente ${varName} não definida!`)
    allVarsPresent = false
  } else {
    // Não precisamos mais verificar por "placeholder-build" aqui,
    // pois não há mais placeholders no Dockerfile.
    // Apenas verificamos se existe.
    console.log(`[RUNTIME_ENV] ✅ ${varName}: ${varName.includes("KEY") ? "***OCULTO***" : value}`)
  }
}

if (!allVarsPresent) {
  console.error("❌ Falha na validação das variáveis de ambiente de runtime. A aplicação não pode iniciar.")
  console.error("   Verifique se todas as variáveis necessárias estão definidas na sua stack do Portainer.")
  process.exit(1)
}

console.log("✅ Todas as variáveis de ambiente de runtime necessárias foram validadas.")
console.log("🚀 Iniciando servidor Next.js (node server.js)...")

const server = spawn("node", ["server.js"], {
  stdio: "inherit",
  env: process.env,
})

server.on("error", (err) => {
  console.error("❌ Erro crítico ao tentar iniciar o servidor Next.js (server.js):", err)
  process.exit(1)
})

server.on("exit", (code, signal) => {
  if (code !== null) {
    console.log(`🚪 Servidor Next.js (server.js) encerrado com código: ${code}`)
  } else if (signal !== null) {
    console.log(`🚪 Servidor Next.js (server.js) encerrado por sinal: ${signal}`)
  } else {
    console.log("🚪 Servidor Next.js (server.js) encerrado.")
  }
  process.exit(code !== null ? code : 1)
})
