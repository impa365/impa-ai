import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase" // Ensure this path is correct and db is properly exported
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  console.log("[API KEYS GET] Request received for /api/user/api-keys")

  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")
    console.log(`[API KEYS GET] User ID from params: ${userId}`)

    if (!userId) {
      console.error("[API KEYS GET] Error: user_id is missing from query parameters.")
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    console.log("[API KEYS GET] Attempting to get query builder from db.apiKeys()")
    const apiKeysTableQueryBuilder = await db.apiKeys() // This could fail if db or getSupabase has issues
    console.log("[API KEYS GET] Successfully got query builder from db.apiKeys()")

    const { data: apiKeys, error: dbError } = await apiKeysTableQueryBuilder
      .select("id, api_key, name, description, created_at, last_used_at, is_active, is_admin_key, access_scope")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (dbError) {
      console.error(`[API KEYS GET] Supabase DB Error: ${dbError.message}`, {
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
      })
      // Return a JSON response with Supabase error details
      return NextResponse.json(
        {
          error: "Erro ao buscar API keys no banco de dados.",
          details: dbError.message,
          code: dbError.code,
        },
        { status: 500 },
      )
    }

    console.log(`[API KEYS GET] Successfully fetched API keys for user ${userId}. Count: ${apiKeys?.length || 0}`)
    return NextResponse.json({ apiKeys: apiKeys || [] })
  } catch (error: unknown) {
    console.error("[API KEYS GET] CRITICAL UNHANDLED ERROR:", error)

    let errorMessage = "Erro interno do servidor desconhecido."
    let errorStack = ""
    if (error instanceof Error) {
      errorMessage = error.message
      errorStack = error.stack || ""
    } else if (typeof error === "string") {
      errorMessage = error
    }

    // Manually construct a JSON response to ensure it's valid
    return new NextResponse(
      JSON.stringify({
        error: "Erro interno crítico no servidor ao processar sua solicitação.",
        details: errorMessage,
        // stack: process.env.NODE_ENV === 'development' ? errorStack : undefined // Optionally include stack in dev
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("[API KEYS POST] Request received for /api/user/api-keys")
  try {
    const body = await request.json()
    const { user_id, description, name, is_admin_key = false } = body
    console.log(`[API KEYS POST] Parsed body for user_id: ${user_id}`)

    if (!user_id) {
      console.error("[API KEYS POST] Error: user_id is missing from request body.")
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    const usersTable = await db.users()
    const { data: user, error: userError } = await usersTable.select("id, role").eq("id", user_id).single()

    if (userError || !user) {
      console.error(`[API KEYS POST] Error fetching user ${user_id}: ${userError?.message}`, userError)
      return NextResponse.json({ error: "Usuário não encontrado", details: userError?.message }, { status: 404 })
    }

    if (is_admin_key && user.role !== "admin") {
      console.warn(`[API KEYS POST] Forbidden: User ${user_id} (role: ${user.role}) attempted to create admin key.`)
      return NextResponse.json(
        { error: "Apenas administradores podem criar API keys de administrador" },
        { status: 403 },
      )
    }

    const apiKeyPrefix = is_admin_key ? "impa_admin" : "impa"
    const apiKey = `${apiKeyPrefix}_${randomBytes(16).toString("hex")}`
    const apiKeyName = name || (is_admin_key ? "API Key de Administrador Padrão" : "API Key Padrão")
    const apiKeyDescription =
      description || (is_admin_key ? "API Key com acesso global (admin)" : "API Key para acesso do usuário")

    const apiKeysTable = await db.apiKeys()
    const { data: newApiKey, error: insertError } = await apiKeysTable
      .insert([
        {
          user_id,
          api_key: apiKey,
          name: apiKeyName,
          description: apiKeyDescription,
          // Ensure 'permissions' column expects a stringified JSON or a native JSONB type.
          // If your column is JSONB, Supabase client handles object directly.
          // If it's text/varchar, JSON.stringify is needed. Assuming JSONB for now.
          permissions: is_admin_key ? ["read", "write", "admin"] : ["read"],
          rate_limit: is_admin_key ? 1000 : 100,
          is_active: true,
          is_admin_key: is_admin_key,
          access_scope: is_admin_key ? "admin" : "user",
          // created_at and updated_at are typically handled by DB defaults
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error(`[API KEYS POST] Supabase DB Error on insert: ${insertError.message}`, insertError)
      return NextResponse.json(
        { error: "Erro ao criar API key.", details: insertError.message, code: insertError.code },
        { status: 500 },
      )
    }

    if (!newApiKey) {
      console.error("[API KEYS POST] Error: newApiKey is null after insert, though no DB error reported.")
      return NextResponse.json({ error: "Falha ao registrar a API key (retorno nulo do banco)." }, { status: 500 })
    }

    console.log(`[API KEYS POST] Successfully created API key ${newApiKey.id} for user ${user_id}`)
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
    console.error("[API KEYS POST] CRITICAL UNHANDLED ERROR:", error)
    let errorMessage = "Erro interno do servidor desconhecido no POST."
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    }
    return new NextResponse(
      JSON.stringify({ error: "Erro interno crítico no servidor (POST).", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

export async function DELETE(request: NextRequest) {
  console.log("[API KEYS DELETE] Request received for /api/user/api-keys")
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id") // ID of the API key to delete
    console.log(`[API KEYS DELETE] API Key ID from params: ${id}`)

    if (!id) {
      console.error("[API KEYS DELETE] Error: ID da API key é obrigatório na query string.")
      return NextResponse.json({ error: "ID da API key é obrigatório" }, { status: 400 })
    }

    const apiKeysTable = await db.apiKeys()
    // Add .eq("user_id", requestingUserId) if you need to ensure ownership before deletion
    const { error: deleteError } = await apiKeysTable.delete().eq("id", id)

    if (deleteError) {
      console.error(`[API KEYS DELETE] Supabase DB Error on delete: ${deleteError.message}`, deleteError)
      return NextResponse.json(
        { error: "Erro ao deletar API key.", details: deleteError.message, code: deleteError.code },
        { status: 500 },
      )
    }

    console.log(`[API KEYS DELETE] Successfully deleted API key ${id}`)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("[API KEYS DELETE] CRITICAL UNHANDLED ERROR:", error)
    let errorMessage = "Erro interno do servidor desconhecido no DELETE."
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    }
    return new NextResponse(
      JSON.stringify({ error: "Erro interno crítico no servidor (DELETE).", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
