import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Buscar configurações da Evolution API via nossa API segura
    const evolutionResponse = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/integrations/evolution/settings/${instanceName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (evolutionResponse.ok) {
      const evolutionResult = await evolutionResponse.json()
      if (evolutionResult.success && evolutionResult.settings) {
        // Mapear configurações da Evolution API para nosso formato
        const settings = {
          groupsIgnore: evolutionResult.settings.groupsIgnore ?? false,
          readMessages: evolutionResult.settings.readMessages ?? true,
          alwaysOnline: evolutionResult.settings.alwaysOnline ?? false,
          readStatus: evolutionResult.settings.readStatus ?? true,
          rejectCall: evolutionResult.settings.rejectCall ?? false,
          msgCall: evolutionResult.settings.msgCall || "Não posso atender no momento, envie uma mensagem.",
          syncFullHistory: evolutionResult.settings.syncFullHistory ?? false,
        }

        // Salvar no banco local para cache
        await saveToDatabase(instanceName, settings)

        return NextResponse.json({
          success: true,
          settings,
          source: "evolution_api",
        })
      }
    }

    // Se não conseguiu da Evolution API, buscar do banco local
    const localSettings = await getFromDatabase(instanceName)

    return NextResponse.json({
      success: true,
      settings: localSettings,
      source: "local_database",
    })
  } catch (error) {
    // Em caso de erro, retornar configurações padrão
    const defaultSettings = getDefaultSettings()
    return NextResponse.json({
      success: true,
      settings: defaultSettings,
      source: "default",
    })
  }
}

export async function POST(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params
    const settings = await request.json()

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Salvar na Evolution API via nossa API segura
    const evolutionResponse = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/integrations/evolution/settings/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      },
    )

    const evolutionResult = await evolutionResponse.json()

    if (!evolutionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: evolutionResult.error || "Erro ao salvar configurações na Evolution API",
        },
        { status: 500 },
      )
    }

    // Salvar no banco local para cache
    await saveToDatabase(instanceName, settings)

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso na Evolution API e banco local",
      source: "evolution_api",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Função auxiliar para salvar no banco
async function saveToDatabase(instanceName: string, settings: any) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) return

    await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        settings: settings,
        updated_at: new Date().toISOString(),
      }),
    })
  } catch (error) {
    // Silenciar erro de cache
  }
}

// Função auxiliar para buscar do banco
async function getFromDatabase(instanceName: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return getDefaultSettings()
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}&select=settings`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    )

    if (response.ok) {
      const connections = await response.json()
      if (connections && connections.length > 0) {
        return {
          ...getDefaultSettings(),
          ...(connections[0].settings || {}),
        }
      }
    }

    return getDefaultSettings()
  } catch (error) {
    return getDefaultSettings()
  }
}

// Configurações padrão
function getDefaultSettings() {
  return {
    groupsIgnore: false,
    readMessages: true,
    alwaysOnline: false,
    readStatus: true,
    rejectCall: false,
    msgCall: "Não posso atender no momento, envie uma mensagem.",
    syncFullHistory: false,
  }
}
