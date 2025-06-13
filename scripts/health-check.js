#!/usr/bin/env node

async function healthCheck() {
  try {
    console.log("🔍 Iniciando health check...")

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || supabaseUrl === "https://placeholder.supabase.co") {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada ou usando placeholder")
    }

    if (!supabaseKey || supabaseKey === "placeholder-anon-key") {
      throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada ou usando placeholder")
    }

    console.log("✅ Variáveis de ambiente validadas")
    console.log(`📍 URL: ${supabaseUrl}`)

    // Testar conexão HTTP simples com Supabase
    const testUrl = `${supabaseUrl}/rest/v1/`

    try {
      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      console.log("✅ Conexão com Supabase validada")
      console.log("🎉 Health check passou!")
      process.exit(0)
    } catch (fetchError) {
      throw new Error(`Erro na conexão HTTP: ${fetchError.message}`)
    }
  } catch (error) {
    console.error("❌ Health check falhou:", error.message)
    process.exit(1)
  }
}

// Polyfill para fetch se não estiver disponível
if (typeof fetch === "undefined") {
  global.fetch = require("node-fetch")
}

healthCheck()
