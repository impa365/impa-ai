/**
 * Script de inicialização da aplicação - APENAS SERVIDOR
 * Valida variáveis de AMBIENTE (runtime)
 */

const { spawn } = require("child_process")

console.log("🚀 Iniciando script de start.js...")

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "PORT", // Adicionar outras variáveis de runtime necessárias
]

let allVarsPresent = true

console.log("🔍 Validando variáveis de ambiente de RUNTIME...")
for (const varName of REQUIRED_ENV_VARS) {
  const value = process.env[varName]
  if (!value) {
    console.error(`🚨 ERRO DE RUNTIME: Variável de ambiente ${varName} não definida!`)
    allVarsPresent = false
  } else if (value.includes("placeholder-build")) {
    // Se o valor de runtime ainda for o placeholder do build, é um erro de configuração.
    console.error(`🚨 ERRO DE RUNTIME: Variável ${varName} está usando o placeholder do BUILD ('${value}').`)
    console.error(`   Isso indica que a variável real não foi injetada pelo Portainer.`)
    allVarsPresent = false
  } else {
    console.log(`[RUNTIME_ENV] ✅ ${varName}: ${varName.includes("KEY") ? "***OCULTO***" : value}`)
  }
}

if (!allVarsPresent) {
  console.error("❌ Falha na validação das variáveis de ambiente de runtime. A aplicação não pode iniciar.")
  process.exit(1)
}

console.log("✅ Todas as variáveis de ambiente de runtime necessárias foram validadas.")

// Inicia o servidor Next.js
console.log("🚀 Iniciando servidor Next.js (node server.js)...")

const server = spawn("node", ["server.js"], {
  stdio: "inherit", // Compartilha stdio com o processo pai
  env: process.env, // Passa todas as variáveis de ambiente atuais
})

server.on("error", (err) => {
  console.error("❌ Erro crítico ao tentar iniciar o servidor Next.js (server.js):", err)
  process.exit(1) // Falha se o spawn do servidor falhar
})

server.on("exit", (code, signal) => {
  if (code !== null) {
    console.log(`🚪 Servidor Next.js (server.js) encerrado com código: ${code}`)
  } else if (signal !== null) {
    console.log(`🚪 Servidor Next.js (server.js) encerrado por sinal: ${signal}`)
  } else {
    console.log("🚪 Servidor Next.js (server.js) encerrado.")
  }
  process.exit(code !== null ? code : 1) // Propaga o código de saída
})
