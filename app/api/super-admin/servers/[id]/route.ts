import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// PUT - Atualizar integração/servidor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, type, url, api_key, is_active } = body

    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    })

    // Mapear tipo da UI para tipo do banco
    const mapTypeToDb = (uiType: string) => {
      if (uiType === 'whatsapp_api') return 'evolution_api'
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
      .update({
        name,
        type: dbType, // usar tipo do banco de dados
        config,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ server: data })
  } catch (error: any) {
    console.error("Erro ao atualizar integração:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar integração" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar integração/servidor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    })

    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao deletar integração:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao deletar integração" },
      { status: 500 }
    )
  }
}
