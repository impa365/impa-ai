import { type NextRequest, NextResponse } from "next/server"
import { createUazapiInstanceServer } from "@/lib/uazapi-server"
import { checkRateLimit, getRequestIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { logResourceCreated, logRateLimitExceeded } from "@/lib/security-audit"
import { query, queryOne, queryMany, buildInsert } from "@/lib/db"

// Função para gerar token único
function generateInstanceToken(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16).toUpperCase()
  })
}

// Função para gerar nome da instância
function generateInstanceName(platformName: string, connectionName: string): string {
  const randomNumber = Math.floor(Math.random() * 9999) + 1000
  const cleanConnectionName = connectionName.toLowerCase().replace(/[^a-z0-9]/g, "")
  const cleanPlatformName = platformName.toLowerCase().replace(/[^a-z0-9]/g, "")
  return `${cleanPlatformName}_${cleanConnectionName}_${randomNumber}`
}

// Função para verificar se nome/token já existe
async function checkInstanceExists(instanceName: string, token: string): Promise<boolean> {
  const rows = await queryMany(
    'SELECT id FROM whatsapp_connections WHERE instance_name = $1 OR instance_token = $2 LIMIT 1',
    [instanceName, token]
  )
  return rows.length > 0
}

// Função para validar se a resposta é JSON
function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type")
  return contentType !== null && contentType.includes("application/json")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionName, userId, apiType = "evolution" } = body

    if (!connectionName || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Nome da conexão e ID do usuário são obrigatórios",
        },
        { status: 400 }
      )
    }

    // 🔒 RATE LIMITING - Operação de escrita
    const rateLimit = checkRateLimit(getRequestIdentifier(request, userId), RATE_LIMITS.WRITE)
    if (!rateLimit.allowed) {
      console.warn(`⚠️ [RATE-LIMIT] User ${userId} bloqueado ao criar instância`)
      logRateLimitExceeded(userId, undefined, '/api/whatsapp/create-instance', request)
      return NextResponse.json(
        { success: false, error: `Muitas requisições. Aguarde ${rateLimit.retryAfter}s` },
        { status: 429 }
      )
    }

    // ==================== VALIDAÇÃO DE LIMITE ====================
    console.log("🔍 Verificando limite de conexões do usuário...")

    // 1. Buscar perfil do usuário e limites
    const userProfiles = await queryMany(
      'SELECT connections_limit, role FROM user_profiles WHERE id = $1',
      [userId]
    )

    if (!userProfiles || userProfiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userProfile = userProfiles[0]
    const userLimit = userProfile.role === "admin" ? 999 : (userProfile.connections_limit || 1)

    console.log(`📊 Limite do usuário: ${userLimit}`)

    // 2. Buscar conexões atuais do usuário
    const existingConnections = await queryMany(
      'SELECT id, created_at FROM whatsapp_connections WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    const currentCount = existingConnections.length

    console.log(`📊 Conexões atuais: ${currentCount} / ${userLimit}`)

    // 3. Verificar se já atingiu o limite
    if (currentCount >= userLimit) {
      console.log("❌ Limite de conexões atingido!")
      return NextResponse.json(
        {
          success: false,
          error: `Você atingiu o limite de ${userLimit} conexão${userLimit > 1 ? "ões" : ""}. Exclua uma conexão existente antes de criar uma nova.`,
          currentCount,
          limit: userLimit
        },
        { status: 403 }
      )
    }

    // 4. Se houver conexões excedentes (caso já criadas), bloquear as mais recentes
    if (currentCount > userLimit) {
      console.log(`⚠️ Detectadas ${currentCount - userLimit} conexões excedentes. Bloqueando...`)
      
      // Pegar apenas as conexões excedentes (mais recentes)
      const connectionsToBlock = existingConnections.slice(0, currentCount - userLimit)
      
      for (const conn of connectionsToBlock) {
        await query('UPDATE whatsapp_connections SET status = $1 WHERE id = $2', ['blocked_limit_exceeded', conn.id])
      }

      console.log(`✅ ${connectionsToBlock.length} conexões bloqueadas por excederem o limite`)
    }

    // Buscar nome da plataforma
    let platformName = "impaai"
    try {
      const themeData = await queryMany('SELECT system_name FROM global_theme_config ORDER BY created_at DESC LIMIT 1')
      if (themeData && themeData.length > 0 && themeData[0].system_name) {
        platformName = themeData[0].system_name
      }
    } catch (themeError) {
      console.warn("⚠️ Erro ao buscar nome da plataforma, usando padrão")
    }

    // Gerar nome e token únicos
    let instanceName: string
    let token: string
    let attempts = 0

    do {
      instanceName = generateInstanceName(platformName, connectionName)
      token = generateInstanceToken()
      attempts++

      if (attempts > 10) {
        return NextResponse.json(
          {
            success: false,
            error: "Erro ao gerar identificadores únicos. Tente novamente.",
          },
          { status: 500 }
        )
      }
    } while (await checkInstanceExists(instanceName, token))

    // ==================== CRIAR INSTÂNCIA NA API SELECIONADA ====================

    let instanceId = null
    let apiResponse: any = null

    if (apiType === "uazapi") {
      // ========== UAZAPI ==========
      console.log('🔧 Criando instância na Uazapi...')
      const result = await createUazapiInstanceServer(instanceName)

      if (!result.success || !result.data) {
        console.error('❌ Erro ao criar instância na Uazapi:', result.error)
        return NextResponse.json({ success: false, error: result.error || "Erro ao criar instância na Uazapi" }, { status: 500 })
      }

      console.log('✅ Instância Uazapi criada com sucesso')
      apiResponse = result.data
      instanceId = result.data.instance.id
      token = result.data.token // Usar o token retornado pela Uazapi
    } else {
      // ========== EVOLUTION API ==========
      // Buscar configurações da Evolution API
      const integrationData = await queryMany(
        'SELECT config FROM integrations WHERE type = $1 AND is_active = true LIMIT 1',
        ['evolution_api']
      )

      if (!integrationData || integrationData.length === 0) {
        return NextResponse.json({ success: false, error: "Evolution API não configurada" }, { status: 400 })
      }

      const config = integrationData[0].config

      if (!config?.apiUrl || !config?.apiKey) {
        return NextResponse.json({ success: false, error: "Evolution API não configurada corretamente" }, { status: 400 })
      }

      // Validar URL da API
      let apiUrl: string
      try {
        const url = new URL(config.apiUrl)
        apiUrl = url.toString().replace(/\/$/, "") // Remove trailing slash
      } catch (urlError) {
        return NextResponse.json(
          {
            success: false,
            error: "URL da Evolution API inválida na configuração",
          },
          { status: 400 }
        )
      }

      // Criar instância na Evolution API
      const requestBody = {
        instanceName,
        token,
        integration: "WHATSAPP-BAILEYS",
      }

      console.log("Fazendo requisição para Evolution API...")

      const evolutionResponse = await fetch(`${apiUrl}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.apiKey,
        },
        body: JSON.stringify(requestBody),
      })

      // Verificar se a resposta é JSON válido
      if (!isJsonResponse(evolutionResponse)) {
        const responseText = await evolutionResponse.text()
        console.error("Evolution API retornou resposta não-JSON:", {
          status: evolutionResponse.status,
          statusText: evolutionResponse.statusText,
          contentType: evolutionResponse.headers.get("content-type"),
          responsePreview: responseText.substring(0, 200) + "...",
        })

        return NextResponse.json(
          {
            success: false,
            error: `Evolution API retornou resposta inválida. Status: ${evolutionResponse.status}. Verifique se a URL e chave da API estão corretas.`,
          },
          { status: 500 }
        )
      }

      if (!evolutionResponse.ok) {
        let errorMessage = `Erro ${evolutionResponse.status}`
        try {
          const errorData = await evolutionResponse.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `${errorMessage} - ${evolutionResponse.statusText}`
        }

        console.error("Erro na Evolution API ao criar instância:", {
          status: evolutionResponse.status,
          statusText: evolutionResponse.statusText,
          error: errorMessage,
        })

        return NextResponse.json({ success: false, error: `Erro na Evolution API: ${errorMessage}` }, { status: 500 })
      }

      let evolutionData: any
      try {
        evolutionData = await evolutionResponse.json()
      } catch (jsonError) {
        console.error("Erro ao fazer parse do JSON da resposta:", jsonError)
        return NextResponse.json(
          {
            success: false,
            error: "Resposta da Evolution API não é um JSON válido.",
          },
          { status: 500 }
        )
      }

      // Verificar se a resposta tem a estrutura esperada
      if (!evolutionData || (!Array.isArray(evolutionData) && !evolutionData.instance)) {
        console.error("Resposta da Evolution API tem estrutura inesperada:", evolutionData)
        return NextResponse.json(
          {
            success: false,
            error: "Resposta da Evolution API tem formato inesperado.",
          },
          { status: 500 }
        )
      }

      apiResponse = evolutionData
      instanceId = Array.isArray(evolutionData) ? evolutionData[0]?.instance?.instanceId || null : evolutionData.instance?.instanceId || null
    }

    // ==================== SALVAR NO BANCO DE DADOS ====================

    const connectionData = {
      user_id: userId,
      connection_name: connectionName,
      instance_name: instanceName,
      instance_id: instanceId,
      instance_token: token,
      status: "disconnected",
      api_type: apiType, // Novo campo para identificar qual API está sendo usada
    }

    const { text: insertText, values: insertValues } = buildInsert('whatsapp_connections', connectionData)
    const connection = await queryOne(insertText, insertValues)

    if (!connection) {
      console.error("Erro ao salvar conexão no banco de dados")
      return NextResponse.json({ success: false, error: "Erro ao salvar conexão no banco de dados." }, { status: 500 })
    }

    // Log de auditoria - criação de conexão
    logResourceCreated(userId, connectionName, 'connection', connection.id, request)

    return NextResponse.json({
      success: true,
      data: {
        connection,
        apiResponse: Array.isArray(apiResponse) ? apiResponse[0] : apiResponse,
        apiType,
      },
    })
  } catch (error: any) {
    console.error("Erro interno ao criar instância:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Erro interno: ${error.message || "Erro desconhecido"}`,
      },
      { status: 500 }
    )
  }
}
