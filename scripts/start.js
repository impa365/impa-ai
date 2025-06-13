/**
 * Script de inicialização da aplicação - APENAS SERVIDOR
 *
 * Este script valida o ambiente e inicia o servidor Next.js
 * NÃO interfere com a hidratação do React
 */

const { spawn } = require("child_process")

console.log("🔍 Validando variáveis de ambiente...")

// Verifica se as variáveis de ambiente estão definidas
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("🚨 ERRO: NEXT_PUBLIC_SUPABASE_URL não definida!")
  process.exit(1)
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("🚨 ERRO: NEXT_PUBLIC_SUPABASE_ANON_KEY não definida!")
  process.exit(1)
}

// Log das variáveis (sem expor a chave)
console.log("✅ Variáveis de ambiente validadas")
console.log(`📍 SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
console.log("🔑 SUPABASE_ANON_KEY: ***DEFINIDA***")

// Inicia o servidor Next.js
console.log("🚀 Iniciando servidor Next.js...")

// Usar spawn para iniciar o processo do Next.js
const server = spawn("node", ["server.js"], {
  stdio: "inherit",
  env: process.env,
})

server.on("error", (err) => {
  console.error("❌ Erro ao iniciar servidor:", err)
  process.exit(1)
})

server.on("exit", (code) => {
  console.log(`🔄 Servidor encerrado com código: ${code}`)
  process.exit(code)
})
