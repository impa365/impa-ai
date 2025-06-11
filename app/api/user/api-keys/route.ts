import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase"
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    // Buscar API keys do usuário
    const { data: apiKeys, error } = await db
      .apiKeys()
      .select("id, api_key, name, description, created_at, last_used_at, is_active, is_admin_key, access_scope")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar API keys do Supabase:", error)
      return NextResponse.json({ error: `Erro ao buscar API keys no banco: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ apiKeys: apiKeys || [] })
  } catch (e: any) {
    console.error("Erro crítico na API GET /api/user/api-keys:", e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Erro interno do servidor (GET): ${errorMessage}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, description, name, is_admin_key = false } = body

    if (!user_id) {
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    // Verificar se o usuário existe e se tem permissão para criar API key de admin
    const { data: user, error: userError } = await db.users().select("id, role").eq("id", user_id).single()

    if (userError || !user) {
      console.error("Erro ao buscar usuário ou usuário não encontrado:", userError)
      return NextResponse.json(
        { error: `Usuário não encontrado ou erro ao buscar: ${userError?.message || "Usuário não existe"}` },
        { status: 404 },
      )
    }

    // Apenas administradores podem criar API keys de administrador
    if (is_admin_key && user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar API keys de administrador" },
        { status: 403 },
      )
    }

    // Gerar nova API key
    const apiKeyPrefix = is_admin_key ? "impa_admin" : "impa"
    const apiKey = `${apiKeyPrefix}_${randomBytes(16).toString("hex")}`
    const apiKeyName = name || (is_admin_key ? "API Key de Administrador" : "API Key para integração N8N")
    const apiKeyDescription =
      description ||
      (is_admin_key ? "API Key com acesso global a todos os bots" : "API Key para integração com sistemas externos")

    console.log("🔑 Criando API key:", {
      userId: user_id,
      isAdmin: is_admin_key,
      userRole: user.role,
      keyName: apiKeyName,
    })

    // Inserir nova API key com todos os campos necessários
    const { data: newApiKey, error: insertError } = await db
      .apiKeys()
      .insert([
        {
          user_id,
          api_key: apiKey,
          name: apiKeyName,
          description: apiKeyDescription,
          permissions: is_admin_key ? ["read", "write", "admin"] : ["read"], // Permissões expandidas para admin
          rate_limit: is_admin_key ? 1000 : 100, // Limite maior para admin
          is_active: true,
          is_admin_key: is_admin_key,
          access_scope: is_admin_key ? "admin" : "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Erro ao inserir API key no Supabase:", insertError)
      return NextResponse.json({ error: `Erro ao criar API key no banco: ${insertError.message}` }, { status: 500 })
    }
    if (!newApiKey) {
      console.error("Falha ao criar API key, newApiKey é null/undefined após insert.")
      return NextResponse.json({ error: "Falha ao criar API key, dados não retornados do banco." }, { status: 500 })
    }

    // Atualizar o usuário com a nova API key (para compatibilidade)
    const { error: updateUserError } = await db.users().update({ api_key: apiKey }).eq("id", user_id)
    if (updateUserError) {
      console.warn("Aviso: Falha ao atualizar users.api_key (campo legado):", updateUserError.message)
    }

    console.log("✅ API key criada com sucesso:", {
      id: newApiKey.id,
      isAdmin: newApiKey.is_admin_key,
      scope: newApiKey.access_scope,
    })

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
  } catch (e: any) {
    console.error("Erro crítico na API POST /api/user/api-keys:", e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    if (e.name === "SyntaxError" && e.message.includes("JSON")) {
      return NextResponse.json({ error: `Corpo da requisição inválido, não é JSON: ${errorMessage}` }, { status: 400 })
    }
    return NextResponse.json({ error: `Erro interno do servidor (POST): ${errorMessage}` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const userId = searchParams.get("user_id")

    if (!id || !userId) {
      return NextResponse.json({ error: "id e user_id são obrigatórios" }, { status: 400 })
    }

    // Deletar API key
    const { error } = await db.apiKeys().delete().eq("id", id).eq("user_id", userId)

    if (error) {
      console.error("Erro ao deletar API key do Supabase:", error)
      return NextResponse.json({ error: `Erro ao deletar API key no banco: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("Erro crítico na API DELETE /api/user/api-keys:", e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Erro interno do servidor (DELETE): ${errorMessage}` }, { status: 500 })
  }
}
