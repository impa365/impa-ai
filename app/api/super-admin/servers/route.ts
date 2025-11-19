import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// GET - Listar servidores
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    })

    // Buscar da tabela integrations em vez de system_servers
    const { data: servers, error } = await supabase
      .from("integrations")
      .select(`
        id,
        name,
        type,
        config,
        is_active,
        created_at,
        updated_at,
        company_id
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mapear tipos antigos para novos
    const mapTypeToNew = (oldType: string) => {
      if (oldType === 'evolution_api' || oldType === 'uazapi') return 'whatsapp_api'
      if (oldType === 'n8n' || oldType === 'n8n_session') return 'n8n_fluxos'
      if (oldType === 'n8n_api') return 'n8n_api'
      return 'whatsapp_api' // default
    }

    // Transformar para formato esperado pela UI
    const formattedServers = (servers || []).map((server: any) => ({
      id: server.id,
      name: server.name,
      type: mapTypeToNew(server.type),
      original_type: server.type, // manter tipo original para referência
      url: server.config?.apiUrl || server.config?.serverUrl || server.config?.flowUrl || server.config?.webhookUrl || server.config?.n8n_url || '',
      api_key: server.config?.apiKey || server.config?.api_key || server.config?.n8n_apikey || '',
      description: `Integração ${server.type}`,
      status: server.is_active ? 'online' : 'offline',
      config: server.config,
      company_id: server.company_id,
      created_at: server.created_at,
      updated_at: server.updated_at,
    }))

    return NextResponse.json({ servers: formattedServers })
  } catch (error: any) {
    console.error("Erro ao buscar servidores:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar servidores" },
      { status: 500 }
    )
  }
}

// POST - Criar integração/servidor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, url, api_key, description, company_id } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    })

    // Mapear tipo da UI para tipo do banco
    const mapTypeToDb = (uiType: string) => {
      if (uiType === 'whatsapp_api') return 'evolution_api' // usar evolution_api como padrão
      if (uiType === 'n8n_fluxos') return 'n8n'
      if (uiType === 'n8n_api') return 'n8n_api'
      return 'evolution_api'
    }

    const dbType = mapTypeToDb(type)

    // Preparar config baseado no tipo
    let config: any = {}
    
    if (type === 'whatsapp_api') {
      config = { apiUrl: url, apiKey: api_key }
    } else if (type === 'n8n_fluxos') {
      config = { flowUrl: url, webhookUrl: url, apiKey: api_key }
    } else if (type === 'n8n_api') {
      config = { n8n_url: url, n8n_apikey: api_key }
    } else {
      config = { serverUrl: url, apiKey: api_key }
    }

    const { data, error } = await supabase
      .from("integrations")
      .insert({
        name,
        type: dbType, // usar tipo do banco de dados
        config,
        is_active: true,
        company_id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ server: data })
  } catch (error: any) {
    console.error("Erro ao criar integração:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao criar integração" },
      { status: 500 }
    )
  }
}
