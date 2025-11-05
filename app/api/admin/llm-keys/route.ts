import { NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"

/**
 * GET /api/admin/llm-keys
 * Lista API keys de LLM (admin pode filtrar por usuário)
 */
export async function GET(request: Request) {
  console.log("📡 API: GET /api/admin/llm-keys chamada")

  try {
    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Montar query baseada no filtro
    let query = `${supabaseUrl}/rest/v1/llm_api_keys?select=id,user_id,key_name,provider,is_active,is_default,usage_count,last_used_at,created_at,updated_at,user_profiles!llm_api_keys_user_id_fkey(id,email,full_name)&order=created_at.desc`
    
    if (userId) {
      query += `&user_id=eq.${userId}`
    }

    console.log("🔍 Buscando API keys LLM...")
    const response = await fetch(query, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao buscar keys:", response.status, errorText)
      throw new Error(`Erro ao buscar keys: ${response.status}`)
    }

    const keys = await response.json()
    
    // Mascarar API keys - mostrar apenas últimos 4 caracteres
    const maskedKeys = keys.map((key: any) => ({
      ...key,
      api_key_preview: `****${key.api_key?.slice(-4) || "****"}`,
      api_key: undefined, // Remover chave completa
    }))

    console.log("✅ API keys encontradas:", maskedKeys.length)
    return NextResponse.json({
      success: true,
      keys: maskedKeys,
    })
  } catch (error: any) {
    console.error("❌ Erro na API admin/llm-keys:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/llm-keys
 * Criar nova API key LLM (admin pode criar para qualquer usuário)
 */
export async function POST(request: Request) {
  console.log("📡 API: POST /api/admin/llm-keys chamada")

  try {
    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 }
      )
    }

    const keyData = await request.json()
    console.log("📝 Criando API key LLM:", {
      key_name: keyData.key_name,
      provider: keyData.provider,
      user_id: keyData.user_id,
    })

    // Validações
    if (!keyData.key_name?.trim()) {
      return NextResponse.json(
        { error: "Nome da chave é obrigatório" },
        { status: 400 }
      )
    }

    if (!keyData.provider) {
      return NextResponse.json(
        { error: "Provedor é obrigatório" },
        { status: 400 }
      )
    }

    if (!["openai", "anthropic", "google", "ollama", "groq"].includes(keyData.provider)) {
      return NextResponse.json(
        { error: "Provedor inválido" },
        { status: 400 }
      )
    }

    if (!keyData.api_key?.trim()) {
      return NextResponse.json(
        { error: "API key é obrigatória" },
        { status: 400 }
      )
    }

    if (!keyData.user_id) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation",
    }

    // Se está marcando como padrão, verificar se já existe outra chave padrão para este provedor
    if (keyData.is_default) {
      const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/llm_api_keys?select=id,key_name&provider=eq.${keyData.provider}&is_default=eq.true&is_active=eq.true`,
        { headers }
      )
      
      if (checkResponse.ok) {
        const existingDefaults = await checkResponse.json()
        if (existingDefaults && existingDefaults.length > 0) {
          // Não permitir criar nova chave padrão se já existe uma
          const existingKey = existingDefaults[0]
          return NextResponse.json(
            { 
              error: `Já existe uma chave padrão para o provedor ${keyData.provider}`,
              details: `A chave "${existingKey.key_name}" já está configurada como padrão. Desmarque-a ou atualize-a antes de criar uma nova.`
            },
            { status: 400 }
          )
        }
      }
    }

    // Preparar dados para inserção
    const dbData = {
      user_id: keyData.user_id,
      key_name: keyData.key_name.trim(),
      provider: keyData.provider,
      api_key: keyData.api_key.trim(), // ⚠️ NOTA: Em produção, criptografar antes de salvar
      description: keyData.description?.trim() || null,
      is_active: keyData.is_active !== undefined ? keyData.is_active : true,
      is_default: keyData.is_default || false,
    }

    console.log("💾 Salvando no banco...")
    const response = await fetch(`${supabaseUrl}/rest/v1/llm_api_keys`, {
      method: "POST",
      headers,
      body: JSON.stringify(dbData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao criar key:", response.status, errorText)
      
      // Tratar erro de chave duplicada
      if (errorText.includes("unique_key_name_per_user")) {
        return NextResponse.json(
          { error: "Já existe uma chave com este nome para este usuário" },
          { status: 400 }
        )
      }
      
      throw new Error(`Erro ao criar key: ${response.status}`)
    }

    const [newKey] = await response.json()
    console.log("✅ API key criada:", newKey.id)

    // Retornar sem a chave completa
    return NextResponse.json({
      success: true,
      key: {
        ...newKey,
        api_key_preview: `****${newKey.api_key?.slice(-4) || "****"}`,
        api_key: undefined,
      },
    })
  } catch (error: any) {
    console.error("❌ Erro ao criar API key:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao criar API key",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/llm-keys
 * Atualizar API key LLM existente
 */
export async function PUT(request: Request) {
  console.log("📡 API: PUT /api/admin/llm-keys chamada")

  try {
    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 }
      )
    }

    const keyData = await request.json()
    const keyId = keyData.id

    if (!keyId) {
      return NextResponse.json(
        { error: "ID da chave é obrigatório" },
        { status: 400 }
      )
    }

    console.log("🔄 Atualizando API key:", keyId)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar a chave atual para obter o provedor
    const getCurrentResponse = await fetch(
      `${supabaseUrl}/rest/v1/llm_api_keys?id=eq.${keyId}&select=provider`,
      { headers }
    )
    
    let currentProvider = null
    if (getCurrentResponse.ok) {
      const [currentKey] = await getCurrentResponse.json()
      currentProvider = currentKey?.provider
    }

    // Se está marcando como padrão, verificar se já existe outra chave padrão para este provedor
    if (keyData.is_default && currentProvider) {
      const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/llm_api_keys?select=id&provider=eq.${currentProvider}&is_default=eq.true&is_active=eq.true&id=neq.${keyId}`,
        { headers }
      )
      
      if (checkResponse.ok) {
        const existingDefaults = await checkResponse.json()
        if (existingDefaults && existingDefaults.length > 0) {
          // Desmarcar todas as outras chaves padrão do mesmo provedor
          const defaultIds = existingDefaults.map((k: any) => k.id).join(",")
          await fetch(
            `${supabaseUrl}/rest/v1/llm_api_keys?id=in.(${defaultIds})`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({ is_default: false }),
            }
          )
        }
      }
    }

    // Preparar dados para atualização (sem api_key se não fornecida)
    const dbData: any = {}
    
    if (keyData.key_name?.trim()) dbData.key_name = keyData.key_name.trim()
    if (keyData.description !== undefined) dbData.description = keyData.description?.trim() || null
    if (keyData.is_active !== undefined) dbData.is_active = keyData.is_active
    if (keyData.is_default !== undefined) dbData.is_default = keyData.is_default
    
    // Apenas atualizar api_key se uma nova foi fornecida
    if (keyData.api_key?.trim()) {
      dbData.api_key = keyData.api_key.trim() // ⚠️ NOTA: Em produção, criptografar
    }

    console.log("💾 Atualizando no banco...")
    const response = await fetch(
      `${supabaseUrl}/rest/v1/llm_api_keys?id=eq.${keyId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(dbData),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao atualizar key:", response.status, errorText)
      throw new Error(`Erro ao atualizar key: ${response.status}`)
    }

    console.log("✅ API key atualizada")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Erro ao atualizar API key:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao atualizar API key",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/llm-keys
 * Deletar API key LLM
 */
export async function DELETE(request: Request) {
  console.log("📡 API: DELETE /api/admin/llm-keys chamada")

  try {
    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get("id")

    if (!keyId) {
      return NextResponse.json(
        { error: "ID da chave é obrigatório" },
        { status: 400 }
      )
    }

    console.log("🗑️ Deletando API key:", keyId)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/llm_api_keys?id=eq.${keyId}`,
      {
        method: "DELETE",
        headers,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao deletar key:", response.status, errorText)
      throw new Error(`Erro ao deletar key: ${response.status}`)
    }

    console.log("✅ API key deletada")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Erro ao deletar API key:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao deletar API key",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

