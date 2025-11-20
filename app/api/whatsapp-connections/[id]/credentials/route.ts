import { NextResponse, type NextRequest } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { logAccessDeniedSimple, logSensitiveDataAccess } from "@/lib/security-audit"

/**
 * ENDPOINT SUPER PROTEGIDO - Credenciais da API
 * 
 * Retorna APENAS URL da API e API Key da instância WhatsApp
 * 
 * PROTEÇÕES:
 * 1. JWT obrigatório
 * 2. Permissão can_view_api_credentials = true
 * 3. Usuário DEVE ser o dono da conexão
 * 4. Rate limiting SENSITIVO (3 req/min)
 * 5. Audit logging de todos os acessos
 * 6. Nunca retorna dados de outros usuários
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: connectionId } = await params
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  let currentUser: any = null

  try {
    // 🔒 PROTEÇÃO 1: Autenticação JWT obrigatória
    currentUser = await getCurrentServerUser(request)
    if (!currentUser) {
      await logAccessDeniedSimple("API_CREDENTIALS", "NO_AUTH", ipAddress, `Connection: ${connectionId}`)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // 🔒 PROTEÇÃO 2: Rate limiting SENSITIVO (3 requisições por minuto)
    const rateLimitKey = `api-credentials-${currentUser.id}`
    const rateLimitResult = await checkRateLimit(rateLimitKey, RATE_LIMITS.SENSITIVE)
    
    if (!rateLimitResult.allowed) {
      await logAccessDeniedSimple(
        "API_CREDENTIALS",
        "RATE_LIMIT_EXCEEDED",
        ipAddress,
        `User: ${currentUser.email} | Connection: ${connectionId}`
      )
      return NextResponse.json(
        { 
          error: "Muitas requisições. Tente novamente em alguns minutos.",
        },
        { status: 429 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // 🔒 PROTEÇÃO 3: Verificar permissão can_view_api_credentials
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?id=eq.${currentUser.id}&select=can_view_api_credentials`,
      { headers }
    )

    if (!userResponse.ok) {
      await logAccessDeniedSimple(
        "API_CREDENTIALS",
        "USER_FETCH_FAILED",
        ipAddress,
        `User: ${currentUser.email} | Connection: ${connectionId}`
      )
      return NextResponse.json({ error: "Erro ao verificar permissões" }, { status: 500 })
    }

    const users = await userResponse.json()
    if (!users || users.length === 0) {
      await logAccessDeniedSimple(
        "API_CREDENTIALS",
        "USER_NOT_FOUND",
        ipAddress,
        `User: ${currentUser.email} | Connection: ${connectionId}`
      )
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const userData = users[0]
    const canViewCredentials = userData.can_view_api_credentials === true

    if (!canViewCredentials) {
      await logAccessDeniedSimple(
        "API_CREDENTIALS",
        "PERMISSION_DENIED",
        ipAddress,
        `User: ${currentUser.email} | Connection: ${connectionId}`
      )
      return NextResponse.json({ 
        error: "Você não tem permissão para visualizar credenciais da API. Contate um administrador." 
      }, { status: 403 })
    }

    // 🔒 PROTEÇÃO 4: Buscar conexão e verificar ownership
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connectionId}&select=id,user_id,connection_name,instance_name,instance_token,api_type`,
      { headers }
    )

    if (!connectionResponse.ok) {
      const errorText = await connectionResponse.text()
      console.error("❌ Erro ao buscar conexão:", connectionResponse.status, errorText)
      await logAccessDeniedSimple(
        "API_CREDENTIALS",
        "CONNECTION_FETCH_FAILED",
        ipAddress,
        `User: ${currentUser.email} | Connection: ${connectionId} | Status: ${connectionResponse.status} | Error: ${errorText}`
      )
      return NextResponse.json({ error: "Erro ao buscar conexão" }, { status: 500 })
    }

    const connections = await connectionResponse.json()
    if (!connections || connections.length === 0) {
      await logAccessDeniedSimple(
        "API_CREDENTIALS",
        "CONNECTION_NOT_FOUND",
        ipAddress,
        `User: ${currentUser.email} | Connection: ${connectionId}`
      )
      return NextResponse.json({ error: "Conexão não encontrada" }, { status: 404 })
    }

    const connection = connections[0]

    // 🔒 PROTEÇÃO 5: VALIDAÇÃO CRÍTICA - Usuário DEVE ser o dono
    if (connection.user_id !== currentUser.id) {
      await logAccessDeniedSimple(
        "API_CREDENTIALS",
        "OWNERSHIP_VIOLATION",
        ipAddress,
        `⚠️ SECURITY ALERT - User ${currentUser.email} tentou acessar conexão de outro usuário! Connection: ${connectionId} | Owner: ${connection.user_id}`
      )
      
      // Retorna 404 em vez de 403 para não revelar que a conexão existe
      return NextResponse.json({ error: "Conexão não encontrada" }, { status: 404 })
    }

    // 🔒 PROTEÇÃO 6: Buscar URL da API na tabela integrations via api_type
    let api_url = ""
    
    // Mapear api_type para integration type
    const integrationTypeMap: Record<string, string> = {
      "evolution": "evolution_api",
      "uazapi": "uazapi"
    }
    
    const integrationType = integrationTypeMap[connection.api_type] || connection.api_type
    
    const integrationResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?type=eq.${integrationType}&select=config`,
      { headers }
    )

    if (integrationResponse.ok) {
      const integrations = await integrationResponse.json()
      if (integrations && integrations.length > 0) {
        const config = integrations[0].config
        // Config é JSONB com apiUrl ou serverUrl
        api_url = config?.apiUrl || config?.serverUrl || ""
      }
    }

    // ✅ TODAS AS VALIDAÇÕES PASSARAM - Registrar acesso legítimo
    await logSensitiveDataAccess(
      "API_CREDENTIALS_VIEW",
      currentUser.email,
      ipAddress,
      `Connection: ${connection.connection_name} (${connectionId}) | Type: ${connection.api_type}`
    )

    // 🎯 Retornar APENAS URL e API Key (dados mínimos necessários)
    return NextResponse.json({
      success: true,
      data: {
        connection_id: connection.id,
        connection_name: connection.connection_name,
        api_type: connection.api_type,
        api_url: api_url,
        api_key: connection.instance_token || "",
      },
    })

  } catch (error: any) {
    console.error("💥 Erro ao buscar credenciais:", error)
    await logAccessDeniedSimple(
      "API_CREDENTIALS",
      "INTERNAL_ERROR",
      ipAddress,
      `User: ${currentUser?.email || "unknown"} | Connection: ${connectionId} | Error: ${error.message}`
    )
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
