import { type NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"

export async function GET(
  request: NextRequest,
  { params }: { params: { instanceName: string } }
) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { instanceName } = params

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuração do banco não encontrada" },
        { status: 500 }
      )
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar a conexão pela instance_name incluindo as colunas adciona_folow e remover_folow
    let url = `${supabaseUrl}/rest/v1/whatsapp_connections?select=*,adciona_folow,remover_folow&instance_name=eq.${instanceName}`
    
    // Se não for admin, filtrar por usuário
    if (user.role !== "admin") {
      url += `&user_id=eq.${user.id}`
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao buscar conexão" },
        { status: response.status }
      )
    }

    const connections = await response.json()

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { error: "Conexão não encontrada" },
        { status: 404 }
      )
    }

    const connection = connections[0]

    return NextResponse.json({
      success: true,
      adciona_folow: connection.adciona_folow || "",
      remover_folow: connection.remover_folow || "",
    })
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { instanceName: string } }
) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { instanceName } = params
    const body = await request.json()
    const { adciona_folow, remover_folow } = body

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuração do banco não encontrada" },
        { status: 500 }
      )
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Primeiro, verificar se a conexão existe e pertence ao usuário
    let checkUrl = `${supabaseUrl}/rest/v1/whatsapp_connections?select=id,user_id&instance_name=eq.${instanceName}`
    
    const checkResponse = await fetch(checkUrl, { headers })

    if (!checkResponse.ok) {
      return NextResponse.json(
        { error: "Erro ao verificar conexão" },
        { status: checkResponse.status }
      )
    }

    const connections = await checkResponse.json()

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { error: "Conexão não encontrada" },
        { status: 404 }
      )
    }

    const connection = connections[0]

    // Verificar se o usuário tem permissão
    if (user.role !== "admin" && connection.user_id !== user.id) {
      return NextResponse.json(
        { error: "Sem permissão para modificar esta conexão" },
        { status: 403 }
      )
    }

    // Atualizar as colunas adciona_folow e remover_folow
    const updateUrl = `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Adicionar apenas os campos que foram fornecidos
    if (adciona_folow !== undefined) {
      updateData.adciona_folow = adciona_folow
    }
    if (remover_folow !== undefined) {
      updateData.remover_folow = remover_folow
    }

    const updateResponse = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify(updateData),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error("Erro ao atualizar configurações:", errorText)
      return NextResponse.json(
        { error: "Erro ao salvar configurações" },
        { status: updateResponse.status }
      )
    }

    const updatedConnection = await updateResponse.json()

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso",
      adciona_folow: Array.isArray(updatedConnection) 
        ? updatedConnection[0]?.adciona_folow 
        : updatedConnection?.adciona_folow,
      remover_folow: Array.isArray(updatedConnection) 
        ? updatedConnection[0]?.remover_folow 
        : updatedConnection?.remover_folow,
    })
  } catch (error) {
    console.error("Erro ao salvar configurações:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
