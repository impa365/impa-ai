import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Criar cliente Supabase diretamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  console.log("🔍 [API KEYS GET] Iniciando...")

  try {
    // Verificar variáveis de ambiente
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis de ambiente do Supabase não configuradas")
      return NextResponse.json({ error: "Configuração do banco de dados não encontrada" }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    if (!userId) {
      console.error("❌ user_id não fornecido")
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    console.log("🔍 Buscando API keys para usuário:", userId)

    // Fazer query simples primeiro
    const { data, error } = await supabase
      .from("user_api_keys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erro na query:", error)
      return NextResponse.json(
        {
          error: "Erro ao buscar API keys",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log("✅ Query executada com sucesso. Encontradas:", data?.length || 0, "API keys")

    return NextResponse.json({
      success: true,
      apiKeys: data || [],
      count: data?.length || 0,
    })
  } catch (error: any) {
    console.error("💥 Erro crítico:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("🔍 [API KEYS POST] Iniciando...")

  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do banco de dados não encontrada" }, { status: 500 })
    }

    const body = await request.json()
    const { user_id, name, description, is_admin_key = false } = body

    if (!user_id) {
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    console.log("🔍 Criando API key para usuário:", user_id)

    // Verificar se usuário existe
    const { data: user, error: userError } = await supabase
      .from("user_profiles")
      .select("id, role")
      .eq("id", user_id)
      .single()

    if (userError || !user) {
      console.error("❌ Usuário não encontrado:", userError)
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Verificar permissões para admin key
    if (is_admin_key && user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar API keys de administrador" },
        { status: 403 },
      )
    }

    // Contar API keys existentes
    const { data: existingKeys, error: countError } = await supabase
      .from("user_api_keys")
      .select("id")
      .eq("user_id", user_id)
      .eq("is_active", true)

    if (countError) {
      console.error("❌ Erro ao contar API keys:", countError)
      return NextResponse.json({ error: "Erro ao verificar API keys existentes" }, { status: 500 })
    }

    const maxKeys = is_admin_key ? 10 : 5
    if (existingKeys && existingKeys.length >= maxKeys) {
      return NextResponse.json({ error: `Limite de ${maxKeys} API keys atingido` }, { status: 400 })
    }

    // Gerar API key
    const prefix = is_admin_key ? "impa_admin" : "impa"
    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const apiKey = `${prefix}_${randomPart}`

    // Inserir nova API key
    const { data: newKey, error: insertError } = await supabase
      .from("user_api_keys")
      .insert({
        user_id,
        api_key: apiKey,
        name: name || "API Key",
        description: description || "API Key para integração",
        permissions: is_admin_key ? ["read", "write", "admin"] : ["read"],
        rate_limit: is_admin_key ? 1000 : 100,
        is_active: true,
        is_admin_key,
        access_scope: is_admin_key ? "admin" : "user",
      })
      .select()
      .single()

    if (insertError) {
      console.error("❌ Erro ao inserir API key:", insertError)
      return NextResponse.json({ error: "Erro ao criar API key", details: insertError.message }, { status: 500 })
    }

    console.log("✅ API key criada com sucesso:", newKey.id)

    return NextResponse.json({
      success: true,
      apiKey: newKey,
    })
  } catch (error: any) {
    console.error("💥 Erro crítico:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  console.log("🔍 [API KEYS DELETE] Iniciando...")

  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do banco de dados não encontrada" }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const user_id = searchParams.get("user_id")

    if (!id || !user_id) {
      return NextResponse.json({ error: "ID e user_id são obrigatórios" }, { status: 400 })
    }

    console.log("🔍 Deletando API key:", id, "do usuário:", user_id)

    const { error } = await supabase.from("user_api_keys").delete().eq("id", id).eq("user_id", user_id)

    if (error) {
      console.error("❌ Erro ao deletar:", error)
      return NextResponse.json({ error: "Erro ao deletar API key", details: error.message }, { status: 500 })
    }

    console.log("✅ API key deletada com sucesso")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("💥 Erro crítico:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
