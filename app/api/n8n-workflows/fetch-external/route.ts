import { NextResponse } from "next/server"

// GET - Buscar workflows da API externa
export async function GET() {
  try {
    const keyFlowsImpa = process.env.KEY_FLOWS_IMPA

    if (!keyFlowsImpa) {
      return NextResponse.json(
        { error: "KEY_FLOWS_IMPA não configurada" },
        { status: 500 }
      )
    }

    const response = await fetch("https://nwook.impa365.com/webhook/puxa-fluxos-impaai", {
      method: "GET",
      headers: {
        apikey: keyFlowsImpa,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar workflows: ${response.status}`)
    }

    const data = await response.json()
    
    // A API retorna um array: [{ data: [...] }]
    // Pegamos o primeiro elemento e acessamos a propriedade 'data'
    const responseData = Array.isArray(data) ? data[0] : data
    const workflowsRaw = responseData?.data || []
    
    // Transformar para o formato esperado pelo frontend
    const workflows = workflowsRaw.map((item: any, index: number) => ({
      workflow: item.workflow || item,
      criado_em: item.criado_em,
      ultima_atualizacao: item.ultima_atualizacao,
      categoria: item.categoria || [],
      imagem_fluxo: item.imagem_fluxo || null,
      prioridade: item.prioridade || index + 1, // Se API não enviar, usa ordem do array
    }))

    return NextResponse.json({
      success: true,
      workflows: workflows,
      count: workflows.length,
    })
  } catch (error: any) {
    console.error("Erro ao buscar workflows da API:", error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
