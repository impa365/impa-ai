import { type NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuário não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { connectionName } = body

    if (!connectionName || connectionName.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Nome da conexão é obrigatório" }, { status: 400 })
    }

    console.log("🔄 Criando conexão WhatsApp para usuário:", user.email, "- Nome:", connectionName)

    // Configuração do Supabase (apenas no servidor)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração do banco não encontrada" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // 1. VERIFICAR LIMITES DO USUÁRIO (SEGURANÇA NO BACKEND)
    const userProfileResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?select=connections_limit,role&id=eq.${user.id}`,
      { headers },
    )

    let userLimit = 2 // padrão
    if (userProfileResponse.ok) {
      const userProfileData = await userProfileResponse.json()
      if (userProfileData && userProfileData.length > 0) {
        const profile = userProfileData[0]

        // Se for admin, limite ilimitado
        if (profile.role === "admin") {
          userLimit = 999
        }
        // Usar connections_limit se definido
        else if (profile.connections_limit !== undefined && profile.connections_limit !== null) {
          userLimit =
            typeof profile.connections_limit === "string"
              ? Number.parseInt(profile.connections_limit)
              : profile.connections_limit
        }
      }
    }

    // 2. VERIFICAR CONEXÕES ATUAIS
    const connectionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=id&user_id=eq.${user.id}`,
      { headers },
    )

    if (!connectionsResponse.ok) {
      return NextResponse.json({ success: false, error: "Erro ao verificar conexões existentes" }, { status: 500 })
    }

    const existingConnections = await connectionsResponse.json()
    const currentCount = existingConnections.length

    console.log(`📊 Usuário tem ${currentCount}/${userLimit} conexões`)

    // 3. VERIFICAR SE ATINGIU O LIMITE (SEGURANÇA CRÍTICA)
    if (currentCount >= userLimit) {
      console.log("🚫 Limite de conexões atingido para usuário:", user.email)
      return NextResponse.json(
        {
          success: false,
          error: `Limite de conexões atingido. Você pode criar no máximo ${userLimit} conexões.`,
          code: "LIMIT_EXCEEDED",
        },
        { status: 403 },
      )
    }

    // 4. VERIFICAR SE JÁ EXISTE CONEXÃO COM MESMO NOME
    const duplicateResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=id&user_id=eq.${user.id}&connection_name=eq.${encodeURIComponent(connectionName)}`,
      { headers },
    )

    if (duplicateResponse.ok) {
      const duplicates = await duplicateResponse.json()
      if (duplicates.length > 0) {
        return NextResponse.json({ success: false, error: "Já existe uma conexão com este nome" }, { status: 400 })
      }
    }

    // 5. CHAMAR A API DE CRIAÇÃO DE INSTÂNCIA
    const createInstanceResponse = await fetch(`${request.nextUrl.origin}/api/whatsapp/create-instance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Passar cookies para manter autenticação
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        connectionName: connectionName.trim(),
        userId: user.id,
      }),
    })

    if (!createInstanceResponse.ok) {
      const errorData = await createInstanceResponse.json()
      console.error("❌ Erro ao criar instância:", errorData)
      return NextResponse.json(
        { success: false, error: errorData.error || "Erro ao criar conexão" },
        { status: createInstanceResponse.status },
      )
    }

    const instanceData = await createInstanceResponse.json()

    console.log("✅ Conexão criada com sucesso para usuário:", user.email)

    // Retornar apenas dados não confidenciais
    return NextResponse.json({
      success: true,
      data: {
        connection: {
          id: instanceData.data.connection.id,
          connection_name: instanceData.data.connection.connection_name,
          instance_name: instanceData.data.connection.instance_name,
          status: instanceData.data.connection.status,
          created_at: instanceData.data.connection.created_at,
        },
        limits: {
          current: currentCount + 1,
          maximum: userLimit,
          canCreate: currentCount + 1 < userLimit,
        },
      },
    })
  } catch (error: any) {
    console.error("💥 Erro interno ao criar conexão:", error)
    return NextResponse.json({ success: false, error: `Erro interno: ${error.message}` }, { status: 500 })
  }
}
