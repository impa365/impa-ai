import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Buscar integrações via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/integrations?select=*&order=created_at.desc`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          integrations: [],
          message: "Tabela 'integrations' não encontrada. Execute o script SQL para criar a estrutura.",
        })
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const integrations = await response.json()
    return NextResponse.json({ integrations })
  } catch (error: any) {
    console.error("Erro ao buscar integrações:", error.message)
    return NextResponse.json({
      integrations: [],
      error: "Erro ao conectar com o banco de dados. Verifique se as tabelas foram criadas.",
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, name, config } = body

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Verificar se já existe uma integração deste tipo
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/integrations?select=*&type=eq.${type}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
    })

    if (checkResponse.ok) {
      const existing = await checkResponse.json()

      if (existing.length > 0) {
        // Atualizar integração existente
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/integrations?id=eq.${existing[0].id}`, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Accept-Profile": "impaai",
            "Content-Profile": "impaai",
          },
          body: JSON.stringify({
            config,
            is_active: true,
            updated_at: new Date().toISOString(),
          }),
        })

        if (!updateResponse.ok) {
          throw new Error(`Erro ao atualizar integração: ${updateResponse.status}`)
        }

        return NextResponse.json({ success: true, message: "Integração atualizada com sucesso!" })
      }
    }

    // Criar nova integração
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/integrations`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
      body: JSON.stringify({
        name: name || (type === "evolution_api" ? "Evolution API" : "n8n"),
        type,
        config,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    })

    if (!createResponse.ok) {
      throw new Error(`Erro ao criar integração: ${createResponse.status}`)
    }

    return NextResponse.json({ success: true, message: "Integração criada com sucesso!" })
  } catch (error: any) {
    console.error("Erro ao salvar integração:", error.message)
    return NextResponse.json({ error: `Erro ao salvar integração: ${error.message}` }, { status: 500 })
  }
}
