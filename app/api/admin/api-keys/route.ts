import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { randomBytes } from "crypto"

export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const userApiKeysTable = await supabase.from("user_api_keys")
    const { data: apiKeys, error } = await userApiKeysTable
      .select(`
        *,
        user_profiles!inner(
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar API keys:", error)
      return NextResponse.json({ error: "Erro ao buscar API keys" }, { status: 500 })
    }

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { name, description, userId, isAdminKey, rateLimit } = await request.json()

    if (!name || !userId) {
      return NextResponse.json({ error: "Nome e usuário são obrigatórios" }, { status: 400 })
    }

    // Gerar API key única
    const prefix = isAdminKey ? "impa_admin_" : "impa_"
    const apiKey = `${prefix}${randomBytes(16).toString("hex")}`

    const userApiKeysTable = await supabase.from("user_api_keys")
    const { data, error } = await userApiKeysTable
      .insert({
        user_id: userId,
        api_key: apiKey,
        name,
        description:
          description ||
          (isAdminKey
            ? "API Key com acesso global a todos os bots do sistema"
            : "API Key para integração com sistemas externos"),
        permissions: isAdminKey ? ["read", "write", "admin"] : ["read"],
        rate_limit: rateLimit || (isAdminKey ? 1000 : 100),
        is_active: true,
        is_admin_key: isAdminKey || false,
        access_scope: isAdminKey ? "admin" : "user",
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar API key:", error)
      return NextResponse.json({ error: "Erro ao criar API key" }, { status: 500 })
    }

    return NextResponse.json({ apiKey: data })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const apiKeyId = searchParams.get("id")

    if (!apiKeyId) {
      return NextResponse.json({ error: "ID da API key é obrigatório" }, { status: 400 })
    }

    const userApiKeysTable = await supabase.from("user_api_keys")
    const { error } = await userApiKeysTable.delete().eq("id", apiKeyId)

    if (error) {
      console.error("Erro ao deletar API key:", error)
      return NextResponse.json({ error: "Erro ao deletar API key" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { id, isActive } = await request.json()

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "ID e status são obrigatórios" }, { status: 400 })
    }

    const userApiKeysTable = await supabase.from("user_api_keys")
    const { error } = await userApiKeysTable.update({ is_active: isActive }).eq("id", id)

    if (error) {
      console.error("Erro ao atualizar API key:", error)
      return NextResponse.json({ error: "Erro ao atualizar API key" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
