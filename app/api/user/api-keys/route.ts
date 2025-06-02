import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { randomBytes } from "crypto"

// Gerar API key aleatória
function generateApiKey(): string {
  return `luna_${randomBytes(32).toString("hex")}`
}

// GET - Obter API keys do usuário
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: apiKeys, error } = await supabase
      .from("user_api_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error("Erro ao buscar API keys:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar nova API key
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { description } = await request.json()
    const apiKey = generateApiKey()

    const { data, error } = await supabase
      .from("user_api_keys")
      .insert({
        user_id: user.id,
        api_key: apiKey,
        description: description || "API Key gerada automaticamente",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ apiKey: data })
  } catch (error) {
    console.error("Erro ao criar API key:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Deletar API key
export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const apiKeyId = searchParams.get("id")

    if (!apiKeyId) {
      return NextResponse.json({ error: "ID da API key é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase.from("user_api_keys").delete().eq("id", apiKeyId).eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar API key:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
