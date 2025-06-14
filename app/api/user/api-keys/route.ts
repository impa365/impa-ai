import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

// Função para criar cliente Supabase com verificações
async function createSupabaseClient() {
  console.log("🔧 [SUPABASE] === CRIANDO CLIENTE SUPABASE ===")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("🔧 [SUPABASE] URL:", supabaseUrl ? `✅ ${supabaseUrl}` : "❌ NÃO CONFIGURADA")
  console.log("🔧 [SUPABASE] Key:", supabaseKey ? `✅ ${supabaseKey.substring(0, 20)}...` : "❌ NÃO CONFIGURADA")

  if (!supabaseUrl) {
    const error = "❌ NEXT_PUBLIC_SUPABASE_URL não está configurada"
    console.error("🔧 [SUPABASE]", error)
    throw new Error(error)
  }

  if (!supabaseKey) {
    const error = "❌ Chave do Supabase não está configurada"
    console.error("🔧 [SUPABASE]", error)
    throw new Error(error)
  }

  try {
    console.log("🔧 [SUPABASE] Criando cliente com schema 'impaai'...")
    const client = createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: "impaai", // ⭐ SCHEMA CORRETO
      },
    })
    console.log("🔧 [SUPABASE] ✅ Cliente criado com sucesso!")
    return client
  } catch (error) {
    console.error("🔧 [SUPABASE] ❌ Falha ao criar cliente:", error)
    throw new Error(`Falha ao criar cliente Supabase: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
  }
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`🚀 [${requestId}] === INICIANDO GET API KEYS ===`)
  console.log(`🚀 [${requestId}] URL: ${request.url}`)
  console.log(`🚀 [${requestId}] Method: ${request.method}`)
  console.log(`🚀 [${requestId}] Timestamp: ${new Date().toISOString()}`)

  // Log das variáveis de ambiente
  console.log(`🚀 [${requestId}] === VERIFICAÇÃO DE AMBIENTE ===`)
  console.log(`🚀 [${requestId}] NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(
    `🚀 [${requestId}] NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Configurada" : "❌ Faltando"}`,
  )
  console.log(
    `🚀 [${requestId}] SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ Faltando"}`,
  )
  console.log(
    `🚀 [${requestId}] NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ Faltando"}`,
  )

  try {
    // 1. PARSING DOS PARÂMETROS
    console.log(`🚀 [${requestId}] === STEP 1: PARSING PARÂMETROS ===`)
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    console.log(`🚀 [${requestId}] User ID recebido: "${userId}"`)
    console.log(`🚀 [${requestId}] Todos os parâmetros:`, Object.fromEntries(searchParams.entries()))

    if (!userId) {
      console.error(`🚀 [${requestId}] ❌ ERRO: user_id é obrigatório`)
      return new NextResponse(JSON.stringify({ error: "user_id é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 2. CRIAÇÃO DO CLIENTE SUPABASE
    console.log(`🚀 [${requestId}] === STEP 2: CRIANDO CLIENTE SUPABASE ===`)
    let supabaseClient
    try {
      supabaseClient = await createSupabaseClient()
      console.log(`🚀 [${requestId}] ✅ Cliente Supabase criado com sucesso`)
    } catch (clientError) {
      console.error(`🚀 [${requestId}] ❌ ERRO ao criar cliente Supabase:`, clientError)
      return new NextResponse(
        JSON.stringify({
          error: "Erro de configuração do banco de dados",
          details: clientError instanceof Error ? clientError.message : "Erro desconhecido",
          step: "client_creation",
          requestId,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // 3. TESTE DE CONEXÃO
    console.log(`🚀 [${requestId}] === STEP 3: TESTANDO CONEXÃO COM BANCO ===`)
    console.log(`🚀 [${requestId}] Testando acesso à tabela 'user_api_keys' no schema 'impaai'...`)

    let testResult
    try {
      testResult = await supabaseClient.from("user_api_keys").select("count", { count: "exact", head: true })
      console.log(`🚀 [${requestId}] Resultado do teste:`, {
        data: testResult.data,
        error: testResult.error,
        count: testResult.count,
      })
    } catch (testException) {
      console.error(`🚀 [${requestId}] ❌ EXCEÇÃO no teste de conexão:`, testException)
      return new NextResponse(
        JSON.stringify({
          error: "Falha na conexão com o banco de dados",
          details: testException instanceof Error ? testException.message : "Exceção desconhecida",
          step: "connection_test",
          requestId,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (testResult.error) {
      console.error(`🚀 [${requestId}] ❌ ERRO no teste de conexão:`, testResult.error)

      // Verificar se é problema de tabela não existir
      if (testResult.error.code === "PGRST116" || testResult.error.message.includes("does not exist")) {
        console.log(`🚀 [${requestId}] 📋 Tabela user_api_keys não existe no schema impaai`)
        return new NextResponse(
          JSON.stringify({
            apiKeys: [],
            error: "Tabela user_api_keys não encontrada no schema impaai. Execute o script SQL para criar a estrutura.",
            needsSetup: true,
            step: "table_missing",
            requestId,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      // Outros erros de banco
      return new NextResponse(
        JSON.stringify({
          error: "Erro de acesso ao banco de dados",
          details: testResult.error.message,
          code: testResult.error.code,
          step: "connection_test",
          requestId,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log(`🚀 [${requestId}] ✅ Conexão com banco OK`)

    // 4. CONSULTA PRINCIPAL
    console.log(`🚀 [${requestId}] === STEP 4: EXECUTANDO CONSULTA PRINCIPAL ===`)
    console.log(`🚀 [${requestId}] Buscando API keys para user_id: ${userId}`)

    let queryResult
    try {
      queryResult = await supabaseClient
        .from("user_api_keys")
        .select("id, api_key, name, description, created_at, last_used_at, is_active, is_admin_key, access_scope")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      console.log(`🚀 [${requestId}] Resultado da consulta:`, {
        data: queryResult.data ? `${queryResult.data.length} registros` : "null",
        error: queryResult.error,
      })
    } catch (queryException) {
      console.error(`🚀 [${requestId}] ❌ EXCEÇÃO na consulta principal:`, queryException)
      return new NextResponse(
        JSON.stringify({
          error: "Exceção durante consulta ao banco",
          details: queryException instanceof Error ? queryException.message : "Exceção desconhecida",
          step: "main_query",
          requestId,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (queryResult.error) {
      console.error(`🚀 [${requestId}] ❌ ERRO na consulta principal:`, {
        message: queryResult.error.message,
        code: queryResult.error.code,
        details: queryResult.error.details,
        hint: queryResult.error.hint,
      })

      return new NextResponse(
        JSON.stringify({
          error: "Erro ao buscar API keys",
          details: queryResult.error.message,
          code: queryResult.error.code,
          step: "main_query",
          requestId,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // 5. SUCESSO
    console.log(`🚀 [${requestId}] === STEP 5: SUCESSO ===`)
    console.log(`🚀 [${requestId}] ✅ Encontradas ${queryResult.data?.length || 0} API keys`)

    if (queryResult.data && queryResult.data.length > 0) {
      console.log(`🚀 [${requestId}] Primeiras API keys:`, queryResult.data.slice(0, 2))
    }

    const response = {
      apiKeys: queryResult.data || [],
      debug: {
        userId,
        count: queryResult.data?.length || 0,
        timestamp: new Date().toISOString(),
        requestId,
        schema: "impaai",
      },
    }

    console.log(`🚀 [${requestId}] Enviando resposta de sucesso`)
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: unknown) {
    // 6. TRATAMENTO DE ERRO GERAL
    console.error(`🚀 [${requestId}] === ERRO CRÍTICO ===`)
    console.error(`🚀 [${requestId}] Tipo do erro:`, typeof error)
    console.error(`🚀 [${requestId}] Erro completo:`, error)

    let errorMessage = "Erro desconhecido"
    let errorStack = ""

    if (error instanceof Error) {
      errorMessage = error.message
      errorStack = error.stack || ""
      console.error(`🚀 [${requestId}] Error.message:`, errorMessage)
      console.error(`🚀 [${requestId}] Error.stack:`, errorStack)
    } else if (typeof error === "string") {
      errorMessage = error
      console.error(`🚀 [${requestId}] String error:`, errorMessage)
    } else {
      console.error(`🚀 [${requestId}] Erro não padrão:`, JSON.stringify(error))
    }

    const errorResponse = {
      error: "Erro crítico no servidor",
      details: errorMessage,
      timestamp: new Date().toISOString(),
      requestId,
      step: "critical_error",
      ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
    }

    console.error(`🚀 [${requestId}] Enviando resposta de erro:`, errorResponse)

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    })
  } finally {
    console.log(`🚀 [${requestId}] === FIM DA REQUISIÇÃO ===`)
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`📝 [${requestId}] === INICIANDO POST API KEYS ===`)

  try {
    console.log(`📝 [${requestId}] Parsing do body...`)
    const body = await request.json()
    const { user_id, description, name, is_admin_key = false } = body

    console.log(`📝 [${requestId}] Dados recebidos:`, { user_id, name, is_admin_key })

    if (!user_id) {
      console.error(`📝 [${requestId}] ❌ user_id é obrigatório`)
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    console.log(`📝 [${requestId}] Criando cliente Supabase...`)
    const supabaseClient = await createSupabaseClient()

    // Verificar usuário
    console.log(`📝 [${requestId}] Verificando usuário...`)
    const { data: user, error: userError } = await supabaseClient
      .from("user_profiles")
      .select("id, role")
      .eq("id", user_id)
      .single()

    if (userError || !user) {
      console.error(`📝 [${requestId}] ❌ Usuário não encontrado:`, userError)
      return NextResponse.json(
        {
          error: "Usuário não encontrado",
          details: userError?.message,
        },
        { status: 404 },
      )
    }

    console.log(`📝 [${requestId}] ✅ Usuário encontrado: ${user.role}`)

    // Verificar permissões admin
    if (is_admin_key && user.role !== "admin") {
      console.error(`📝 [${requestId}] ❌ Usuário não é admin tentando criar chave admin`)
      return NextResponse.json(
        {
          error: "Apenas administradores podem criar API keys de administrador",
        },
        { status: 403 },
      )
    }

    // Gerar API key
    const apiKeyPrefix = is_admin_key ? "impa_admin" : "impa"
    const apiKey = `${apiKeyPrefix}_${randomBytes(16).toString("hex")}`
    const apiKeyName = name || (is_admin_key ? "API Key de Administrador" : "API Key Padrão")
    const apiKeyDescription = description || (is_admin_key ? "API Key com acesso global" : "API Key para integração")

    console.log(`📝 [${requestId}] Inserindo API key...`)
    const { data: newApiKey, error: insertError } = await supabaseClient
      .from("user_api_keys")
      .insert([
        {
          user_id,
          api_key: apiKey,
          name: apiKeyName,
          description: apiKeyDescription,
          permissions: is_admin_key ? ["read", "write", "admin"] : ["read"],
          rate_limit: is_admin_key ? 1000 : 100,
          is_active: true,
          is_admin_key: is_admin_key,
          access_scope: is_admin_key ? "admin" : "user",
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error(`📝 [${requestId}] ❌ Erro ao inserir:`, insertError)
      return NextResponse.json(
        {
          error: "Erro ao criar API key",
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 },
      )
    }

    console.log(`📝 [${requestId}] ✅ API key criada: ${newApiKey.id}`)

    return NextResponse.json({
      success: true,
      apiKey: {
        id: newApiKey.id,
        api_key: newApiKey.api_key,
        name: newApiKey.name,
        description: newApiKey.description,
        created_at: newApiKey.created_at,
        is_active: newApiKey.is_active,
        is_admin_key: newApiKey.is_admin_key,
        access_scope: newApiKey.access_scope,
      },
    })
  } catch (error: unknown) {
    console.error(`📝 [${requestId}] ❌ ERRO CRÍTICO:`, error)

    let errorMessage = "Erro desconhecido"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    }

    return new NextResponse(
      JSON.stringify({
        error: "Erro crítico no servidor (POST)",
        details: errorMessage,
        timestamp: new Date().toISOString(),
        requestId,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`🗑️ [${requestId}] === INICIANDO DELETE API KEYS ===`)

  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    console.log(`🗑️ [${requestId}] API Key ID: ${id}`)

    if (!id) {
      console.error(`🗑️ [${requestId}] ❌ ID é obrigatório`)
      return NextResponse.json({ error: "ID da API key é obrigatório" }, { status: 400 })
    }

    console.log(`🗑️ [${requestId}] Criando cliente Supabase...`)
    const supabaseClient = await createSupabaseClient()

    console.log(`🗑️ [${requestId}] Deletando API key...`)
    const { error: deleteError } = await supabaseClient.from("user_api_keys").delete().eq("id", id)

    if (deleteError) {
      console.error(`🗑️ [${requestId}] ❌ Erro ao deletar:`, deleteError)
      return NextResponse.json(
        {
          error: "Erro ao deletar API key",
          details: deleteError.message,
          code: deleteError.code,
        },
        { status: 500 },
      )
    }

    console.log(`🗑️ [${requestId}] ✅ API key deletada`)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error(`🗑️ [${requestId}] ❌ ERRO CRÍTICO:`, error)

    let errorMessage = "Erro desconhecido"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    }

    return new NextResponse(
      JSON.stringify({
        error: "Erro crítico no servidor (DELETE)",
        details: errorMessage,
        timestamp: new Date().toISOString(),
        requestId,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
