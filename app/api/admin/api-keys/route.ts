import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    // 1. Cliente faz requisição segura
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. API faz requisição para endpoint interno (seguindo padrão do projeto)
    const response = await fetch(`/api/database/api-keys`, {
      // Caminho relativo
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.id}`, // Usando ID do usuário admin
      },
    })

    if (!response.ok) {
      throw new Error(`Database API error: ${response.status}`)
    }

    const data = await response.json()

    // 3. API entrega para o painel
    return NextResponse.json(data)
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

    // 2. API faz requisição para endpoint interno
    const response = await fetch(`/api/database/api-keys`, {
      // Caminho relativo
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.id}`,
      },
      body: JSON.stringify({
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
      }),
    })

    if (!response.ok) {
      throw new Error(`Database API error: ${response.status}`)
    }

    // 3. API confirma para o painel
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
