/**
 * Helper functions para gerenciar bots Uazapi
 */

import type { Bot } from "@/types/bot"
import { createUazapiWebhook, deleteUazapiWebhook } from "./uazapi-webhook-helpers"

interface UpdateBotParams {
  botId: string
  botData: Partial<Bot>
  supabaseUrl: string
  supabaseKey: string
}

interface UpdateBotResult {
  success: boolean
  bot?: Bot
  error?: string
}

/**
 * Atualiza um bot Uazapi no banco de dados
 */
export async function updateUazapiBotInDatabase({
  botId,
  botData,
  supabaseUrl,
  supabaseKey,
}: UpdateBotParams): Promise<UpdateBotResult> {
  try {
    console.log(`🔄 [UAZAPI-BOT] Atualizando bot ${botId} no banco...`)

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Converter ignoreJids de array para string se necessário
    let updatePayload = { ...botData }
    if (botData.ignoreJids && Array.isArray(botData.ignoreJids)) {
      updatePayload.ignoreJids = (botData.ignoreJids as any).join(",") + ","
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/bots?id=eq.${botId}`, {
      method: "PATCH",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify(updatePayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [UAZAPI-BOT] Erro ao atualizar bot:", response.status, errorText)
      return {
        success: false,
        error: `Erro ao atualizar bot: ${response.status}`,
      }
    }

    const [updatedBot] = await response.json()
    console.log("✅ [UAZAPI-BOT] Bot atualizado com sucesso")

    return {
      success: true,
      bot: updatedBot,
    }
  } catch (error: any) {
    console.error("❌ [UAZAPI-BOT] Erro ao atualizar bot:", error)
    return {
      success: false,
      error: error.message || "Erro desconhecido ao atualizar bot",
    }
  }
}

interface UpdateBotWebhookParams extends UpdateBotParams {
  connectionId: string
  ignoreGroups?: boolean
}

/**
 * Atualiza o webhook Uazapi se necessário (deleta o antigo e cria um novo)
 * Usado quando a URL do webhook ou configurações mudam
 */
export async function updateUazapiBotWebhook({
  botId,
  botData,
  connectionId,
  ignoreGroups = true,
  supabaseUrl,
  supabaseKey,
}: UpdateBotWebhookParams): Promise<UpdateBotResult> {
  try {
    console.log(`🔄 [UAZAPI-BOT] Atualizando webhook do bot ${botId}...`)

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // 1. Buscar bot atual para obter webhook_id antigo
    const botResponse = await fetch(`${supabaseUrl}/rest/v1/bots?id=eq.${botId}`, {
      headers,
    })

    if (!botResponse.ok) {
      return {
        success: false,
        error: "Erro ao buscar bot atual",
      }
    }

    const bots = await botResponse.json()
    const currentBot = bots[0]

    if (!currentBot) {
      return {
        success: false,
        error: "Bot não encontrado",
      }
    }

    // 2. Buscar conexão WhatsApp
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connectionId}`,
      { headers }
    )

    if (!connectionResponse.ok) {
      return {
        success: false,
        error: "Erro ao buscar conexão WhatsApp",
      }
    }

    const connections = await connectionResponse.json()
    const connection = connections[0]

    if (!connection) {
      return {
        success: false,
        error: "Conexão WhatsApp não encontrada",
      }
    }

    // 3. Buscar configuração Uazapi
    const uazapiResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.uazapi&is_active=eq.true`,
      { headers }
    )

    if (!uazapiResponse.ok) {
      return {
        success: false,
        error: "Erro ao buscar configuração Uazapi",
      }
    }

    const uazapiIntegrations = await uazapiResponse.json()
    if (!uazapiIntegrations || uazapiIntegrations.length === 0) {
      return {
        success: false,
        error: "Uazapi não configurada",
      }
    }

    const uazapiConfig =
      typeof uazapiIntegrations[0].config === "string"
        ? JSON.parse(uazapiIntegrations[0].config)
        : uazapiIntegrations[0].config

    // 4. Deletar webhook antigo se existir
    if (currentBot.webhook_id) {
      console.log("🗑️ [UAZAPI-BOT] Deletando webhook antigo:", currentBot.webhook_id)
      await deleteUazapiWebhook({
        uazapiServerUrl: uazapiConfig.serverUrl,
        instanceToken: connection.instance_token,
        webhookId: currentBot.webhook_id,
      })
    }

    // 5. Criar novo webhook se tiver url_api
    let newWebhookId: string | undefined

    if (botData.url_api || currentBot.url_api) {
      const webhookUrl = botData.url_api || currentBot.url_api
      console.log("🌐 [UAZAPI-BOT] Criando novo webhook:", webhookUrl)

      const webhookResult = await createUazapiWebhook({
        uazapiServerUrl: uazapiConfig.serverUrl,
        instanceToken: connection.instance_token,
        webhookUrl,
        ignoreGroups,
      })

      if (!webhookResult.success) {
        return {
          success: false,
          error: `Erro ao criar webhook: ${webhookResult.error}`,
        }
      }

      newWebhookId = webhookResult.webhookId
      console.log("✅ [UAZAPI-BOT] Novo webhook criado:", newWebhookId)
    }

    // 6. Atualizar bot no banco com novo webhook_id
    const updateResult = await updateUazapiBotInDatabase({
      botId,
      botData: {
        ...botData,
        webhook_id: newWebhookId || null,
      },
      supabaseUrl,
      supabaseKey,
    })

    return updateResult
  } catch (error: any) {
    console.error("❌ [UAZAPI-BOT] Erro ao atualizar webhook:", error)
    return {
      success: false,
      error: error.message || "Erro desconhecido ao atualizar webhook",
    }
  }
}

