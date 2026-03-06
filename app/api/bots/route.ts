import { NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { queryMany, buildInsert, queryOne } from "@/lib/db"

/**
 * GET /api/bots
 * Lista todos os bots do usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    console.log(`🔍 [GET /api/bots] Buscando bots do usuário: ${user.email}`)

    // Buscar bots do usuário
    const bots = await queryMany(
      "SELECT * FROM bots WHERE user_id = $1 ORDER BY created_at DESC",
      [user.id]
    )

    console.log(`✅ [GET /api/bots] ${bots.length} bot(s) encontrado(s)`)

    return NextResponse.json({ success: true, bots }, { status: 200 })
  } catch (error: any) {
    console.error("❌ [GET /api/bots] Erro:", error)
    return NextResponse.json(
      { error: "Erro interno ao buscar bots", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bots
 * Cria um novo bot (usado internamente ao criar agente)
 * 
 * Nota: Este endpoint é usado internamente pela API de criação de agentes.
 * Não cria o webhook da Uazapi - isso é feito no endpoint de agentes.
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const body = await request.json()

    console.log(`📝 [POST /api/bots] Criando bot para usuário: ${user.email}`)

    // Validações
    if (!body.nome || !body.url_api || !body.connection_id) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, url_api, connection_id" },
        { status: 400 }
      )
    }

    // Validar gatilho e operador
    const validGatilhos = ['Palavra-chave', 'Todos', 'Avançado', 'Nenhum']
    if (body.gatilho && !validGatilhos.includes(body.gatilho)) {
      return NextResponse.json(
        { error: `Gatilho inválido. Valores aceitos: ${validGatilhos.join(', ')}` },
        { status: 400 }
      )
    }

    const validOperadores = ['Contém', 'Igual', 'Começa Com', 'Termina Com', 'Regex']
    if (body.operador_gatilho && !validOperadores.includes(body.operador_gatilho)) {
      return NextResponse.json(
        { error: `Operador inválido. Valores aceitos: ${validOperadores.join(', ')}` },
        { status: 400 }
      )
    }

    // Se gatilho é "Palavra-chave", value_gatilho é obrigatório
    if (body.gatilho === 'Palavra-chave' && !body.value_gatilho?.trim()) {
      return NextResponse.json(
        { error: "value_gatilho é obrigatório quando gatilho é 'Palavra-chave'" },
        { status: 400 }
      )
    }

    // Montar payload
    const botPayload = {
      nome: body.nome,
      url_api: body.url_api,
      apikey: body.apikey || null,
      gatilho: body.gatilho || 'Todos',
      operador_gatilho: body.operador_gatilho || 'Contém',
      value_gatilho: body.value_gatilho || null,
      debounce: body.debounce || 5,
      splitMessage: body.splitMessage || 2,
      ignoreJids: body.ignoreJids || '@g.us,',
      user_id: user.id,
      connection_id: body.connection_id,
    }

    console.log('📦 [POST /api/bots] Payload:', { ...botPayload, apikey: botPayload.apikey ? '***' : null })

    // Criar bot
    const insert = buildInsert("bots", botPayload)
    const bot = await queryOne(insert.text, insert.values)

    if (!bot) {
      console.error("❌ [POST /api/bots] Erro ao criar bot: nenhum registro retornado")
      return NextResponse.json(
        { error: "Erro ao criar bot" },
        { status: 500 }
      )
    }

    console.log(`✅ [POST /api/bots] Bot criado com sucesso: ${bot.id}`)

    return NextResponse.json({ success: true, bot }, { status: 201 })
  } catch (error: any) {
    console.error("❌ [POST /api/bots] Erro:", error)
    return NextResponse.json(
      { error: "Erro interno ao criar bot", details: error.message },
      { status: 500 }
    )
  }
}
