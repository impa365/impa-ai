import { NextResponse } from "next/server"

// GET - Buscar workflows da API externa
export async function GET() {
  try {
    const keyFlowsImpa = process.env.KEY_FLOWS_IMPA

    if (!keyFlowsImpa) {
      console.error("❌ KEY_FLOWS_IMPA não configurada no .env")
      return NextResponse.json(
        { error: "KEY_FLOWS_IMPA não configurada" },
        { status: 500 }
      )
    }

    console.log("🔄 Fazendo requisição para API externa...")
    console.log(`🔑 KEY_FLOWS_IMPA configurada: ${keyFlowsImpa.substring(0, 10)}...`)

    const response = await fetch("https://nwook.impa365.com/webhook/puxa-fluxos-impaai", {
      method: "GET",
      headers: {
        apikey: keyFlowsImpa,
        "Content-Type": "application/json",
      },
    })

    console.log(`📡 Resposta da API: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      // Tentar ler o corpo da resposta para mais detalhes
      let errorBody = ""
      try {
        errorBody = await response.text()
        console.error(`❌ Corpo do erro: ${errorBody}`)
      } catch (e) {
        console.error("❌ Não foi possível ler o corpo da resposta")
      }
      
      console.error(`❌ API Externa retornou erro ${response.status}`)
      console.error(`🔑 Verificar se KEY_FLOWS_IMPA está correta: ${keyFlowsImpa.substring(0, 10)}...`)
      console.error(`🌐 URL testada: https://nwook.impa365.com/webhook/puxa-fluxos-impaai`)
      
      return NextResponse.json(
        { 
          success: false,
          error: `API Externa retornou HTTP ${response.status}`,
          details: errorBody || "Sem detalhes adicionais",
          httpStatus: response.status
        },
        { status: response.status } // Retornar o mesmo status da API
      )
    }

    // Ler o corpo como texto primeiro para debug
    const responseText = await response.text()
    console.log(`📄 Corpo da resposta (${responseText.length} caracteres):`, responseText.substring(0, 500))

    // Verificar se a resposta não está vazia
    if (!responseText || responseText.trim().length === 0) {
      console.error("❌ API retornou resposta vazia!")
      return NextResponse.json(
        { 
          success: false,
          error: "API Externa retornou resposta vazia",
          workflows: [],
          count: 0
        },
        { status: 200 }
      )
    }

    // Tentar fazer parse do JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError: any) {
      console.error("❌ Erro ao fazer parse do JSON:", parseError.message)
      console.error("📄 Resposta recebida:", responseText.substring(0, 1000))
      return NextResponse.json(
        { 
          success: false,
          error: "API retornou JSON inválido",
          details: parseError.message,
          rawResponse: responseText.substring(0, 500)
        },
        { status: 500 }
      )
    }
    
    console.log("📦 Dados recebidos da API:", JSON.stringify(data).substring(0, 200) + "...")
    console.log("📊 Tipo de dados:", Array.isArray(data) ? "Array" : typeof data)
    
    // A API retorna um array: [{ data: [...] }]
    // Pegamos o primeiro elemento e acessamos a propriedade 'data'
    const responseData = Array.isArray(data) ? data[0] : data
    console.log("📊 responseData:", JSON.stringify(responseData).substring(0, 200) + "...")
    
    const workflowsRaw = responseData?.data || []
    
    console.log(`✅ Total de workflows encontrados: ${workflowsRaw.length}`)
    
    // Se não houver workflows, retornar array vazio com sucesso
    if (workflowsRaw.length === 0) {
      console.log("⚠️ Nenhum workflow encontrado na API")
      return NextResponse.json({
        success: true,
        workflows: [],
        count: 0,
        message: "Nenhum workflow disponível na API"
      })
    }
    
    // Ordenar workflows por ID numérico ANTES de atribuir prioridade
    const workflowsSorted = [...workflowsRaw].sort((a, b) => {
      const idA = parseInt(a.id || a.workflow?.id || '999')
      const idB = parseInt(b.id || b.workflow?.id || '999')
      return idA - idB
    })
    
    console.log(`📊 Ordem após sort por ID:`, workflowsSorted.map(w => `${w.id}-${w.nome}`).join(', '))
    
    // Transformar para o formato esperado pelo frontend
    const workflows = workflowsSorted.map((item: any, index: number) => ({
      workflow: item.workflow || item,
      criado_em: item.criado_em,
      ultima_atualizacao: item.ultima_atualizacao,
      categoria: item.categoria || [],
      imagem_fluxo: item.imagem_fluxo || null,
      prioridade: item.prioridade || index + 1, // Se API não enviar, usa ordem do array APÓS sort
    }))

    console.log(`✅ Workflows processados com sucesso: ${workflows.length} items`)

    return NextResponse.json({
      success: true,
      workflows: workflows,
      count: workflows.length,
    })
  } catch (error: any) {
    console.error("💥 ERRO FATAL ao buscar workflows da API:", error.message)
    console.error("📚 Stack trace:", error.stack)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
