import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { randomBytes } from "crypto"

// Função para obter usuário do header Authorization
function getUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      // Tentar obter do localStorage via cookie ou session
      const userCookie = request.cookies.get("user")
      if (userCookie) {
        return JSON.parse(userCookie.value)
      }
      return null
    }

    // Se tiver Authorization header, processar
    const token = authHeader.replace("Bearer ", "")
    // Aqui você pode implementar validação de JWT se necessário
    return null
  } catch {
    return null
  }
}

// Função alternativa para obter usuário atual
async function getCurrentUserFromDB(request: NextRequest) {
  try {
    // Tentar obter user_id dos headers customizados
    const userId = request.headers.get("x-user-id")
    if (!userId) return null

    const { data: user, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    if (error) return null
    return user
  } catch {
    return null
  }
}

// Gerar API key aleatória
function generateApiKey(): string {
  return `luna_${randomBytes(32).toString("hex")}`
}

// GET - Obter API keys do usuário
export async function GET(request: NextRequest) {
  try {
    // Tentar múltiplas formas de obter o usuário
    const userIdFromUrl = new URL(request.url).searchParams.get("user_id")

    if (!userIdFromUrl) {
      return NextResponse.json({ error: "User ID é obrigatório" }, { status: 400 })
    }

    const { data: apiKeys, error } = await supabase
      .from("user_api_keys")
      .select("*")
      .eq("user_id", userIdFromUrl)
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
    const body = await request.json()
    const { description, user_id } = body

    if (!user_id) {
      return NextResponse.json({ error: "User ID é obrigatório" }, { status: 400 })
    }

    const apiKey = generateApiKey()

    const { data, error } = await supabase
      .from("user_api_keys")
      .insert({
        user_id: user_id,
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
    const { searchParams } = new URL(request.url)
    const apiKeyId = searchParams.get("id")
    const userId = searchParams.get("user_id")

    if (!apiKeyId || !userId) {
      return NextResponse.json({ error: "ID da API key e User ID são obrigatórios" }, { status: 400 })
    }

    const { error } = await supabase.from("user_api_keys").delete().eq("id", apiKeyId).eq("user_id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar API key:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
