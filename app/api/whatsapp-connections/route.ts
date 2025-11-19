import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let user
    try {
      user = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }

    console.log("✅ Usuário autenticado:", user.email, "| Role:", user.role)

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuração do banco não encontrada",
        },
        { status: 500 },
      )
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // 🔒 SEGURANÇA: Admins veem tudo, usuários só suas próprias conexões
    const isAdmin = user.role === "admin"
    
    let url = `${supabaseUrl}/rest/v1/whatsapp_connections?select=*,adciona_folow,remover_folow,api_type,instance_token,user_profiles(id,email,full_name)&order=connection_name.asc`

    // Filtrar por usuário se não for admin
    if (!isAdmin) {
      url += `&user_id=eq.${user.id}`
    }

    const response = await fetch(url, {
      headers,
      cache: "no-store", // Evitar cache
    })

    if (!response.ok) {
      const errorText = await response.text()
      // LOG DETALHADO NO SERVIDOR
      console.error("[WhatsApp-Connections][ERRO] Falha ao buscar conexões:", {
        url,
        status: response.status,
        userId,
        isAdmin,
        errorText,
      })
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao buscar conexões: ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const connections = await response.json()

    // Filtrar dados sensíveis
    const safeConnections = connections.map((conn: any) => ({
      id: conn.id,
      connection_name: conn.connection_name,
      instance_name: conn.instance_name,
      status: conn.status || "disconnected",
      api_type: conn.api_type || "evolution", // CRÍTICO: Incluir api_type
      user_id: conn.user_id,
      phone_number: conn.phone_number,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
      user_profiles: conn.user_profiles,
      settings: conn.settings,
      adciona_folow: conn.adciona_folow,
      remover_folow: conn.remover_folow,
    }))

    return NextResponse.json({
      success: true,
      connections: safeConnections,
    })
  } catch (error: any) {
    // LOG DETALHADO DE EXCEÇÃO
    console.error("[WhatsApp-Connections][EXCEPTION] Erro inesperado ao buscar conexões:", {
      message: error.message,
      stack: error.stack,
      url: request.url,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
