import { type NextRequest, NextResponse } from "next/server"
import { fetchEvolutionBotSettings, setEvolutionInstanceSettings } from "@/lib/evolution-api"

export async function GET(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Buscar configurações da Evolution API primeiro
    const evolutionSettings = await fetchEvolutionBotSettings(instanceName)

    if (evolutionSettings) {
      // Se encontrou na Evolution API, usar essas configurações
      const settings = {
        groupsIgnore: evolutionSettings.groupsIgnore ?? false,
        readMessages: evolutionSettings.readMessages ?? true,
        alwaysOnline: evolutionSettings.alwaysOnline ?? false,
        readStatus: evolutionSettings.readStatus ?? true,
        rejectCall: evolutionSettings.rejectCall ?? false,
        msgCall: evolutionSettings.msgCall || "Não posso atender no momento, envie uma mensagem.",
        syncFullHistory: evolutionSettings.syncFullHistory ?? false,
      }

      // Salvar no banco local para cache
      await saveToDatabase(instanceName, settings)

      return NextResponse.json({
        success: true,
        settings,
        source: "evolution_api",
      })
    }

    // Se não encontrou na Evolution API, buscar do banco local
    const localSettings = await getFromDatabase(instanceName)

    return NextResponse.json({
      success: true,
      settings: localSettings,
      source: "local_database",
    })
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params
    const settings = await request.json()

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // 1. Salvar na Evolution API primeiro
    const evolutionSuccess = await setEvolutionInstanceSettings(instanceName, settings)

    if (!evolutionSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao salvar configurações na Evolution API",
        },
        { status: 500 },
      )
    }

    // 2. Salvar no banco local para cache
    await saveToDatabase(instanceName, settings)

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso na Evolution API e banco local",
      source: "evolution_api",
    })
  } catch (error) {
    console.error("Erro ao salvar configurações:", error)
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
    console.error("Erro ao salvar no banco:", error)
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
    console.error("Erro ao buscar do banco:", error)
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
