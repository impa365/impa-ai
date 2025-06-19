import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // 1. Cliente faz requisição segura
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. API faz requisição segura para o banco
    const { data: apiKeysData, error: apiKeysError } = await supabase
      .from("user_api_keys")
      .select(`
        id,
        user_id,
        name,
        api_key,
        description,
        is_active,
        last_used_at,
        created_at,
        user_profiles!inner(
          full_name,
          email,
          role
        )
      `)
      .order("created_at", { ascending: false })

    if (apiKeysError) {
      console.error("❌ Erro ao buscar API keys:", apiKeysError)
      return NextResponse.json({ error: "Erro ao buscar API keys" }, { status: 500 })
    }

    // 3. Banco entrega informações para API
    // 4. API entrega para o painel (somente o necessário)
    return NextResponse.json(apiKeysData || [])
  } catch (error) {
    console.error("❌ Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Cliente faz requisição segura
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { user_id, name, description } = await request.json()

    if (!user_id || !name) {
      return NextResponse.json({ error: "User ID e nome são obrigatórios" }, { status: 400 })
    }

    // Gerar API key
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let apiKey = "impaai_"
    for (let i = 0; i < 32; i++) {
      apiKey += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // 2. API faz requisição segura para o banco
    const { error } = await supabase.from("user_api_keys").insert({
      user_id,
      name: name.trim(),
      api_key: apiKey,
      description: description?.trim() || "API Key para integração",
      permissions: ["read"],
      rate_limit: 100,
      is_active: true,
      is_admin_key: false,
      access_scope: "user",
      allowed_ips: [],
      usage_count: 0,
    })

    if (error) {
      console.error("❌ Erro ao criar API key:", error)
      return NextResponse.json({ error: "Erro ao criar API key" }, { status: 500 })
    }

    // 3. Banco confirma criação
    // 4. API confirma para o painel
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
