import { NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { queryMany, queryOne, query, buildInsert } from "@/lib/db"

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

    const conditions: string[] = []
    const params: any[] = []
    let paramIdx = 1

    if (userId) {
      conditions.push(`k.user_id = $${paramIdx++}`)
      params.push(userId)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    console.log("🔍 Buscando API keys LLM...")
    const keys = await queryMany(
      `SELECT k.id, k.user_id, k.key_name, k.provider, k.api_key, k.is_active, k.is_default,
              k.usage_count, k.last_used_at, k.created_at, k.updated_at,
              up.id AS user_profile_id, up.email AS user_profile_email, up.full_name AS user_profile_full_name
       FROM llm_api_keys k
       LEFT JOIN user_profiles up ON k.user_id = up.id
       ${whereClause}
       ORDER BY k.created_at DESC`,
      params
    )

    // Mascarar API keys e formatar user_profiles como objeto aninhado
    const maskedKeys = keys.map((key: any) => ({
      id: key.id,
      user_id: key.user_id,
      key_name: key.key_name,
      provider: key.provider,
      is_active: key.is_active,
      is_default: key.is_default,
      usage_count: key.usage_count,
      last_used_at: key.last_used_at,
      created_at: key.created_at,
      updated_at: key.updated_at,
      api_key_preview: `****${key.api_key?.slice(-4) || "****"}`,
      user_profiles: {
        id: key.user_profile_id,
        email: key.user_profile_email,
        full_name: key.user_profile_full_name,
      },
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

    // Se está marcando como padrão, verificar se já existe outra chave padrão para este provedor
    if (keyData.is_default) {
      const existingDefaults = await queryMany(
        `SELECT id, key_name FROM llm_api_keys WHERE provider = $1 AND is_default = true AND is_active = true`,
        [keyData.provider]
      )

      if (existingDefaults.length > 0) {
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
    try {
      const ins = buildInsert("llm_api_keys", dbData)
      const newKey = await queryOne(ins.text, ins.values)
      console.log("✅ API key criada:", newKey?.id)

      // Retornar sem a chave completa
      return NextResponse.json({
        success: true,
        key: {
          ...newKey,
          api_key_preview: `****${newKey?.api_key?.slice(-4) || "****"}`,
          api_key: undefined,
        },
      })
    } catch (insertError: any) {
      // Tratar erro de chave duplicada
      if (insertError.message?.includes("unique_key_name_per_user") || insertError.code === "23505") {
        return NextResponse.json(
          { error: "Já existe uma chave com este nome para este usuário" },
          { status: 400 }
        )
      }
      throw insertError
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

    // Buscar a chave atual para obter o provedor
    const currentKey = await queryOne(
      `SELECT provider FROM llm_api_keys WHERE id = $1`,
      [keyId]
    )
    const currentProvider = currentKey?.provider

    // Se está marcando como padrão, desmarcar outras chaves padrão do mesmo provedor
    if (keyData.is_default && currentProvider) {
      const existingDefaults = await queryMany(
        `SELECT id FROM llm_api_keys WHERE provider = $1 AND is_default = true AND is_active = true AND id != $2`,
        [currentProvider, keyId]
      )

      if (existingDefaults.length > 0) {
        const defaultIds = existingDefaults.map((k: any) => k.id)
        await query(
          `UPDATE llm_api_keys SET is_default = false WHERE id = ANY($1)`,
          [defaultIds]
        )
      }
    }

    // Preparar dados para atualização (sem api_key se não fornecida)
    const setClauses: string[] = []
    const params: any[] = []
    let paramIdx = 1

    if (keyData.key_name?.trim()) {
      setClauses.push(`key_name = $${paramIdx++}`)
      params.push(keyData.key_name.trim())
    }
    if (keyData.description !== undefined) {
      setClauses.push(`description = $${paramIdx++}`)
      params.push(keyData.description?.trim() || null)
    }
    if (keyData.is_active !== undefined) {
      setClauses.push(`is_active = $${paramIdx++}`)
      params.push(keyData.is_active)
    }
    if (keyData.is_default !== undefined) {
      setClauses.push(`is_default = $${paramIdx++}`)
      params.push(keyData.is_default)
    }
    // Apenas atualizar api_key se uma nova foi fornecida
    if (keyData.api_key?.trim()) {
      setClauses.push(`api_key = $${paramIdx++}`)
      params.push(keyData.api_key.trim()) // ⚠️ NOTA: Em produção, criptografar
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: true })
    }

    params.push(keyId)
    console.log("💾 Atualizando no banco...")
    await query(
      `UPDATE llm_api_keys SET ${setClauses.join(", ")} WHERE id = $${paramIdx}`,
      params
    )

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

    await query(`DELETE FROM llm_api_keys WHERE id = $1`, [keyId])

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

