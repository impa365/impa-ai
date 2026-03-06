import { NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { deleteUazapiWebhook } from "@/lib/uazapi-webhook-helpers"
import { getUazapiConfigServer } from "@/lib/uazapi-server"
import { queryMany, queryOne, query, buildUpdate } from "@/lib/db"

/**
 * GET /api/bots/[id]
 * Busca um bot específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    console.log(`🔍 [GET /api/bots/${id}] Buscando bot`)

    // Buscar bot
    const bots = await queryMany(
      "SELECT * FROM bots WHERE id = $1 AND user_id = $2",
      [id, user.id]
    )

    if (bots.length === 0) {
      return NextResponse.json({ error: "Bot não encontrado" }, { status: 404 })
    }

    const bot = bots[0]
    console.log(`✅ [GET /api/bots/${id}] Bot encontrado`)

    return NextResponse.json({ success: true, bot }, { status: 200 })
  } catch (error: any) {
    console.error(`❌ [GET /api/bots/[id]] Erro:`, error)
    return NextResponse.json(
      { error: "Erro interno ao buscar bot", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/bots/[id]
 * Atualiza um bot específico
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const body = await request.json()

    console.log(`📝 [PUT /api/bots/${id}] Atualizando bot`)

    // Verificar se o bot pertence ao usuário
    const checkBot = await queryOne(
      "SELECT id FROM bots WHERE id = $1 AND user_id = $2",
      [id, user.id]
    )

    if (!checkBot) {
      return NextResponse.json({ error: "Bot não encontrado ou não pertence ao usuário" }, { status: 404 })
    }

    // Validar gatilho e operador se fornecidos
    if (body.gatilho) {
      const validGatilhos = ['Palavra-chave', 'Todos', 'Avançado', 'Nenhum']
      if (!validGatilhos.includes(body.gatilho)) {
        return NextResponse.json(
          { error: `Gatilho inválido. Valores aceitos: ${validGatilhos.join(', ')}` },
          { status: 400 }
        )
      }
    }

    if (body.operador_gatilho) {
      const validOperadores = ['Contém', 'Igual', 'Começa Com', 'Termina Com', 'Regex']
      if (!validOperadores.includes(body.operador_gatilho)) {
        return NextResponse.json(
          { error: `Operador inválido. Valores aceitos: ${validOperadores.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Atualizar bot
    const update = buildUpdate("bots", body, { id, user_id: user.id })
    const bot = await queryOne(update.text, update.values)

    if (!bot) {
      console.error(`❌ [PUT /api/bots/${id}] Erro ao atualizar bot: nenhum registro retornado`)
      return NextResponse.json(
        { error: "Erro ao atualizar bot" },
        { status: 500 }
      )
    }

    console.log(`✅ [PUT /api/bots/${id}] Bot atualizado com sucesso`)

    return NextResponse.json({ success: true, bot }, { status: 200 })
  } catch (error: any) {
    console.error(`❌ [PUT /api/bots/[id]] Erro:`, error)
    return NextResponse.json(
      { error: "Erro interno ao atualizar bot", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/bots/[id]
 * Deleta um bot e seu webhook da Uazapi (com rollback se necessário)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    console.log(`🗑️ [DELETE /api/bots/${id}] Deletando bot`)

    // Buscar bot com connection_id para pegar instance_token
    const bot = await queryOne(
      "SELECT * FROM bots WHERE id = $1 AND user_id = $2",
      [id, user.id]
    )

    if (!bot) {
      return NextResponse.json({ error: "Bot não encontrado ou não pertence ao usuário" }, { status: 404 })
    }

    // Se tem webhook_id, tentar deletar o webhook da Uazapi
    if (bot.webhook_id) {
      console.log(`🔄 [DELETE /api/bots/${id}] Tentando deletar webhook: ${bot.webhook_id}`)
      console.log(`📝 [DELETE /api/bots/${id}] Dados do bot:`, {
        id: bot.id,
        webhook_id: bot.webhook_id,
        connection_id: bot.connection_id,
        user_id: bot.user_id
      })

      // Buscar connection para pegar instance_token
      const connection = await queryOne<{ instance_token: string; api_type: string }>(
        "SELECT instance_token, api_type FROM whatsapp_connections WHERE id = $1",
        [bot.connection_id]
      )

      console.log(`📡 [DELETE /api/bots/${id}] Connection encontrada: ${!!connection}`)

      if (connection) {
        console.log(`🔗 [DELETE /api/bots/${id}] Connection API Type: ${connection.api_type}`)
        
        // Verificar se é Uazapi
        if (connection.api_type !== 'uazapi') {
          console.log(`⚠️ [DELETE /api/bots/${id}] Connection não é Uazapi, pulando deleção de webhook`)
        } else {
          const uazapiConfig = await getUazapiConfigServer()

          if (!uazapiConfig) {
            console.error(`❌ [DELETE /api/bots/${id}] Uazapi config não encontrada!`)
          } else {
            console.log(`🔧 [DELETE /api/bots/${id}] Deletando webhook na Uazapi...`)
            const deleteResult = await deleteUazapiWebhook({
              uazapiServerUrl: uazapiConfig.serverUrl,
              instanceToken: connection.instance_token,
              webhookId: bot.webhook_id,
            })

            if (!deleteResult.success) {
              console.warn(`⚠️ [DELETE /api/bots/${id}] Falha ao deletar webhook, mas continuando: ${deleteResult.error}`)
            } else {
              console.log(`✅ [DELETE /api/bots/${id}] Webhook deletado da Uazapi com sucesso!`)
            }
          }
        }
      } else {
        console.warn(`⚠️ [DELETE /api/bots/${id}] Connection não encontrada para connection_id: ${bot.connection_id}`)
      }
    } else {
      console.log(`ℹ️ [DELETE /api/bots/${id}] Bot não possui webhook_id, pulando deleção de webhook`)
    }

    // Deletar bot do banco
    await query(
      "DELETE FROM bots WHERE id = $1 AND user_id = $2",
      [id, user.id]
    )

    console.log(`✅ [DELETE /api/bots/${id}] Bot deletado com sucesso`)

    return NextResponse.json(
      { success: true, message: "Bot deletado com sucesso" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(`❌ [DELETE /api/bots/[id]] Erro:`, error)
    return NextResponse.json(
      { error: "Erro interno ao deletar bot", details: error.message },
      { status: 500 }
    )
  }
}

