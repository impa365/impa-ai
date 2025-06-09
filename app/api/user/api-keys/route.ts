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
      .select("id, api_key, name, description, created_at, last_used_at, is_active")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar API keys:", error)
      return NextResponse.json({ error: "Erro ao buscar API keys" }, { status: 500 })
    }

    return NextResponse.json({ apiKeys: apiKeys || [] })
  } catch (error) {
    console.error("Erro na API de API keys:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, description, name } = body

    if (!user_id) {
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await db.users().select("id").eq("id", user_id).single()

    if (userError || !user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Gerar nova API key
    const apiKey = `impa_${randomBytes(16).toString("hex")}`
    const apiKeyName = name || "API Key para integração N8N"
    const apiKeyDescription = description || "API Key para integração com sistemas externos"

    // Inserir nova API key com todos os campos necessários
    const { data: newApiKey, error: insertError } = await db
      .apiKeys()
      .insert([
        {
          user_id,
          api_key: apiKey,
          name: apiKeyName,
          description: apiKeyDescription,
          permissions: ["read"], // Permissão padrão
          rate_limit: 100, // Limite padrão
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Erro ao criar API key:", insertError)
      return NextResponse.json({ error: "Erro ao criar API key" }, { status: 500 })
    }

    // Atualizar o usuário com a nova API key (para compatibilidade)
    await db.users().update({ api_key: apiKey }).eq("id", user_id)

    return NextResponse.json({
      success: true,
      apiKey: {
        id: newApiKey.id,
        api_key: newApiKey.api_key,
        name: newApiKey.name,
        description: newApiKey.description,
        created_at: newApiKey.created_at,
        is_active: newApiKey.is_active,
      },
    })
  } catch (error) {
    console.error("Erro ao criar API key:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
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
      console.error("Erro ao deletar API key:", error)
      return NextResponse.json({ error: "Erro ao deletar API key" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar API key:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
