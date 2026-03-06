import { type NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { queryOne, queryMany } from "@/lib/db"

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

    // 1. VERIFICAR LIMITES DO USUÁRIO (SEGURANÇA NO BACKEND)
    const profile = await queryOne<{ connections_limit: any; role: string }>(
      'SELECT connections_limit, role FROM user_profiles WHERE id = $1',
      [user.id]
    )

    let userLimit = 2 // padrão
    if (profile) {
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

    // 2. VERIFICAR CONEXÕES ATUAIS
    const existingConnections = await queryMany<{ id: string }>(
      'SELECT id FROM whatsapp_connections WHERE user_id = $1',
      [user.id]
    )
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
    const duplicates = await queryMany<{ id: string }>(
      'SELECT id FROM whatsapp_connections WHERE user_id = $1 AND connection_name = $2',
      [user.id, connectionName]
    )

    if (duplicates.length > 0) {
      return NextResponse.json({ success: false, error: "Já existe uma conexão com este nome" }, { status: 400 })
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
