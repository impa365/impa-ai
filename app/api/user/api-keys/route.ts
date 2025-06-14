import { type NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  console.log("🔍 [API KEYS GET] === REQUEST START ===")

  try {
    console.log("🔍 [API KEYS GET] Parsing request parameters...")
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    console.log(`🔍 [API KEYS GET] User ID: ${userId}`)

    if (!userId) {
      console.error("❌ [API KEYS GET] Missing user_id parameter")
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    console.log("🔍 [API KEYS GET] Getting Supabase client...")
    const supabaseClient = await getSupabase()
    console.log("✅ [API KEYS GET] Supabase client obtained successfully")

    console.log("🔍 [API KEYS GET] Executing database query...")
    const { data: apiKeys, error: dbError } = await supabaseClient
      .from("user_api_keys")
      .select("id, api_key, name, description, created_at, last_used_at, is_active, is_admin_key, access_scope")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (dbError) {
      console.error("❌ [API KEYS GET] Database error:", {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
      })

      return NextResponse.json(
        {
          error: "Erro ao buscar API keys no banco de dados",
          details: dbError.message,
          code: dbError.code,
        },
        { status: 500 },
      )
    }

    console.log(`✅ [API KEYS GET] Query successful. Found ${apiKeys?.length || 0} API keys`)

    return NextResponse.json({
      apiKeys: apiKeys || [],
      debug: {
        userId,
        count: apiKeys?.length || 0,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error("💥 [API KEYS GET] CRITICAL ERROR:", error)

    // Extract error details safely
    let errorMessage = "Unknown error occurred"
    let errorStack = ""

    if (error instanceof Error) {
      errorMessage = error.message
      errorStack = error.stack || ""
      console.error("💥 [API KEYS GET] Error message:", errorMessage)
      console.error("💥 [API KEYS GET] Error stack:", errorStack)
    } else if (typeof error === "string") {
      errorMessage = error
      console.error("💥 [API KEYS GET] String error:", errorMessage)
    } else {
      console.error("💥 [API KEYS GET] Non-standard error:", JSON.stringify(error))
    }

    // Force a valid JSON response
    const errorResponse = {
      error: "Erro crítico no servidor",
      details: errorMessage,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
    }

    console.log("🔍 [API KEYS GET] Sending error response:", JSON.stringify(errorResponse))

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    })
  } finally {
    console.log("🔍 [API KEYS GET] === REQUEST END ===")
  }
}

export async function POST(request: NextRequest) {
  console.log("🔍 [API KEYS POST] === REQUEST START ===")

  try {
    console.log("🔍 [API KEYS POST] Parsing request body...")
    const body = await request.json()
    const { user_id, description, name, is_admin_key = false } = body

    console.log(`🔍 [API KEYS POST] User ID: ${user_id}, Admin Key: ${is_admin_key}`)

    if (!user_id) {
      console.error("❌ [API KEYS POST] Missing user_id in body")
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    console.log("🔍 [API KEYS POST] Getting Supabase client...")
    const supabaseClient = await getSupabase()
    console.log("✅ [API KEYS POST] Supabase client obtained successfully")

    // Verify user exists and get role
    console.log("🔍 [API KEYS POST] Verifying user...")
    const { data: user, error: userError } = await supabaseClient
      .from("user_profiles")
      .select("id, role")
      .eq("id", user_id)
      .single()

    if (userError || !user) {
      console.error("❌ [API KEYS POST] User not found:", userError)
      return NextResponse.json(
        {
          error: "Usuário não encontrado",
          details: userError?.message,
        },
        { status: 404 },
      )
    }

    console.log(`✅ [API KEYS POST] User found with role: ${user.role}`)

    // Check admin permissions
    if (is_admin_key && user.role !== "admin") {
      console.error("❌ [API KEYS POST] Non-admin trying to create admin key")
      return NextResponse.json(
        {
          error: "Apenas administradores podem criar API keys de administrador",
        },
        { status: 403 },
      )
    }

    // Generate API key
    const apiKeyPrefix = is_admin_key ? "impa_admin" : "impa"
    const apiKey = `${apiKeyPrefix}_${randomBytes(16).toString("hex")}`
    const apiKeyName = name || (is_admin_key ? "API Key de Administrador" : "API Key Padrão")
    const apiKeyDescription = description || (is_admin_key ? "API Key com acesso global" : "API Key para integração")

    console.log("🔍 [API KEYS POST] Creating API key...")
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
      console.error("❌ [API KEYS POST] Insert error:", insertError)
      return NextResponse.json(
        {
          error: "Erro ao criar API key",
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 },
      )
    }

    if (!newApiKey) {
      console.error("❌ [API KEYS POST] No data returned from insert")
      return NextResponse.json(
        {
          error: "Falha ao criar API key - sem dados retornados",
        },
        { status: 500 },
      )
    }

    console.log(`✅ [API KEYS POST] API key created successfully: ${newApiKey.id}`)

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
    console.error("💥 [API KEYS POST] CRITICAL ERROR:", error)

    let errorMessage = "Unknown error occurred"
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
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  } finally {
    console.log("🔍 [API KEYS POST] === REQUEST END ===")
  }
}

export async function DELETE(request: NextRequest) {
  console.log("🔍 [API KEYS DELETE] === REQUEST START ===")

  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    console.log(`🔍 [API KEYS DELETE] API Key ID: ${id}`)

    if (!id) {
      console.error("❌ [API KEYS DELETE] Missing id parameter")
      return NextResponse.json({ error: "ID da API key é obrigatório" }, { status: 400 })
    }

    console.log("🔍 [API KEYS DELETE] Getting Supabase client...")
    const supabaseClient = await getSupabase()
    console.log("✅ [API KEYS DELETE] Supabase client obtained successfully")

    console.log("🔍 [API KEYS DELETE] Deleting API key...")
    const { error: deleteError } = await supabaseClient.from("user_api_keys").delete().eq("id", id)

    if (deleteError) {
      console.error("❌ [API KEYS DELETE] Delete error:", deleteError)
      return NextResponse.json(
        {
          error: "Erro ao deletar API key",
          details: deleteError.message,
          code: deleteError.code,
        },
        { status: 500 },
      )
    }

    console.log("✅ [API KEYS DELETE] API key deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("💥 [API KEYS DELETE] CRITICAL ERROR:", error)

    let errorMessage = "Unknown error occurred"
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
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  } finally {
    console.log("🔍 [API KEYS DELETE] === REQUEST END ===")
  }
}
