import { NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { deleteUazapiWebhook } from "@/lib/uazapi-webhook-helpers"
import { getUazapiConfigServer } from "@/lib/uazapi-server"

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

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [GET /api/bots] Variáveis de ambiente não encontradas")
      return NextResponse.json(
        { error: "Configuração do Supabase não encontrada" },
        { status: 500 }
      )
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // Buscar bot
    const response = await fetch(
      `${supabaseUrl}/rest/v1/bots?id=eq.${id}&user_id=eq.${user.id}&select=*`,
      { headers }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [GET /api/bots/${id}] Erro ao buscar bot:`, response.status, errorText)
      return NextResponse.json(
        { error: "Erro ao buscar bot", details: errorText },
        { status: response.status }
      )
    }

    const bots = await response.json()

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

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [PUT /api/bots] Variáveis de ambiente não encontradas")
      return NextResponse.json(
        { error: "Configuração do Supabase não encontrada" },
        { status: 500 }
      )
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      Prefer: "return=representation",
    }

    // Verificar se o bot pertence ao usuário
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/bots?id=eq.${id}&user_id=eq.${user.id}&select=id`,
      { headers }
    )

    if (!checkResponse.ok) {
      return NextResponse.json({ error: "Erro ao verificar bot" }, { status: 500 })
    }

    const checkBots = await checkResponse.json()
    if (checkBots.length === 0) {
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
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/bots?id=eq.${id}&user_id=eq.${user.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      }
    )

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error(`❌ [PUT /api/bots/${id}] Erro ao atualizar bot:`, updateResponse.status, errorText)
      return NextResponse.json(
        { error: "Erro ao atualizar bot", details: errorText },
        { status: updateResponse.status }
      )
    }

    const updatedBots = await updateResponse.json()
    const bot = updatedBots[0]

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

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [DELETE /api/bots] Variáveis de ambiente não encontradas")
      return NextResponse.json(
        { error: "Configuração do Supabase não encontrada" },
        { status: 500 }
      )
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // Buscar bot com connection_id para pegar instance_token
    const getBotResponse = await fetch(
      `${supabaseUrl}/rest/v1/bots?id=eq.${id}&user_id=eq.${user.id}&select=*`,
      { headers }
    )

    if (!getBotResponse.ok) {
      return NextResponse.json({ error: "Erro ao buscar bot" }, { status: 500 })
    }

    const bots = await getBotResponse.json()
    if (bots.length === 0) {
      return NextResponse.json({ error: "Bot não encontrado ou não pertence ao usuário" }, { status: 404 })
    }

    const bot = bots[0]

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
      const getConnectionResponse = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${bot.connection_id}&select=instance_token,api_type`,
        { headers }
      )

      console.log(`📡 [DELETE /api/bots/${id}] Response da connection: ${getConnectionResponse.status}`)

      if (getConnectionResponse.ok) {
        const connections = await getConnectionResponse.json()
        console.log(`📊 [DELETE /api/bots/${id}] Connections encontradas: ${connections.length}`)
        
        if (connections.length > 0) {
          const connection = connections[0]
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
        const errorText = await getConnectionResponse.text()
        console.error(`❌ [DELETE /api/bots/${id}] Erro ao buscar connection: ${getConnectionResponse.status} - ${errorText}`)
      }
    } else {
      console.log(`ℹ️ [DELETE /api/bots/${id}] Bot não possui webhook_id, pulando deleção de webhook`)
    }

    // Deletar bot do banco
    const deleteResponse = await fetch(
      `${supabaseUrl}/rest/v1/bots?id=eq.${id}&user_id=eq.${user.id}`,
      {
        method: "DELETE",
        headers,
      }
    )

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text()
      console.error(`❌ [DELETE /api/bots/${id}] Erro ao deletar bot:`, deleteResponse.status, errorText)
      return NextResponse.json(
        { error: "Erro ao deletar bot", details: errorText },
        { status: deleteResponse.status }
      )
    }

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

