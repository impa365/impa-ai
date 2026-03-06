import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { queryMany, queryOne, query, buildInsert, buildUpdate } from "@/lib/db"

/**
 * GET /api/user/llm-keys
 * Lista API keys de LLM do usuário logado
 */
export async function GET(request: Request) {
  console.log("📡 API: GET /api/user/llm-keys chamada")

  try {
    // Buscar usuário atual do cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("🔍 Buscando API keys LLM do usuário:", currentUser.id)
    const keys = await queryMany(
      `SELECT id, key_name, provider, is_active, is_default, usage_count, last_used_at, created_at, updated_at
       FROM llm_api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [currentUser.id]
    )

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
    console.error("❌ Erro na API user/llm-keys:", error.message)
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
 * POST /api/user/llm-keys
 * Criar nova API key LLM para o usuário logado
 */
export async function POST(request: Request) {
  console.log("📡 API: POST /api/user/llm-keys chamada")

  try {
    // Buscar usuário atual do cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const keyData = await request.json()
    console.log("📝 Criando API key LLM:", {
      key_name: keyData.key_name,
      provider: keyData.provider,
      user_id: currentUser.id,
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

    // Se está marcando como padrão, verificar se já existe outra chave padrão para este provedor
    if (keyData.is_default) {
      const existingDefaults = await queryMany(
        'SELECT id, key_name FROM llm_api_keys WHERE provider = $1 AND is_default = true AND is_active = true',
        [keyData.provider]
      )

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

    // Preparar dados para inserção - FORÇAR user_id do usuário logado
    const dbData = {
      user_id: currentUser.id, // ⚠️ IMPORTANTE: Sempre usar o ID do usuário autenticado
      key_name: keyData.key_name.trim(),
      provider: keyData.provider,
      api_key: keyData.api_key.trim(), // ⚠️ NOTA: Em produção, criptografar antes de salvar
      description: keyData.description?.trim() || null,
      is_active: keyData.is_active !== undefined ? keyData.is_active : true,
      is_default: keyData.is_default || false,
    }

    console.log("💾 Salvando no banco...")
    try {
      const { text, values } = buildInsert('llm_api_keys', dbData)
      const newKey = await queryOne(text, values)

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
    } catch (dbError: any) {
      // Tratar erro de chave duplicada
      if (dbError.message?.includes("unique_key_name_per_user") || dbError.code === '23505') {
        return NextResponse.json(
          { error: "Já existe uma chave com este nome" },
          { status: 400 }
        )
      }
      throw dbError
    }
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
 * PUT /api/user/llm-keys
 * Atualizar API key LLM do usuário logado
 */
export async function PUT(request: Request) {
  console.log("📡 API: PUT /api/user/llm-keys chamada")

  try {
    // Buscar usuário atual do cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
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

    // Buscar a chave atual para obter o provedor
    const currentKey = await queryOne<{ provider: string }>(
      'SELECT provider FROM llm_api_keys WHERE id = $1 AND user_id = $2',
      [keyId, currentUser.id]
    )

    const currentProvider = currentKey?.provider || null

    // Se está marcando como padrão, verificar se já existe outra chave padrão para este provedor
    if (keyData.is_default && currentProvider) {
      const existingDefaults = await queryMany<{ id: string }>(
        'SELECT id FROM llm_api_keys WHERE provider = $1 AND is_default = true AND is_active = true AND id != $2',
        [currentProvider, keyId]
      )

      if (existingDefaults && existingDefaults.length > 0) {
        // Desmarcar todas as outras chaves padrão do mesmo provedor
        const defaultIds = existingDefaults.map((k) => k.id)
        await query(
          `UPDATE llm_api_keys SET is_default = false WHERE id = ANY($1)`,
          [defaultIds]
        )
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
    const { text, values } = buildUpdate('llm_api_keys', dbData, { id: keyId, user_id: currentUser.id })
    await query(text, values)

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
 * DELETE /api/user/llm-keys
 * Deletar API key LLM do usuário logado
 */
export async function DELETE(request: Request) {
  console.log("📡 API: DELETE /api/user/llm-keys chamada")

  try {
    // Buscar usuário atual do cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
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

    await query(
      'DELETE FROM llm_api_keys WHERE id = $1 AND user_id = $2',
      [keyId, currentUser.id]
    )

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

