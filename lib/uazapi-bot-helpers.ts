/**
 * Helper functions para gerenciar bots Uazapi
 * Migrated from Supabase REST API to direct PostgreSQL via lib/db
 */

import type { Bot } from "@/types/bot"
import { createUazapiWebhook, deleteUazapiWebhook } from "./uazapi-webhook-helpers"
import { queryOne, queryMany, buildUpdate } from "@/lib/db"

interface UpdateBotParams {
  botId: string
  botData: Partial<Bot>
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
}: UpdateBotParams): Promise<UpdateBotResult> {
  try {
    console.log(`🔄 [UAZAPI-BOT] Atualizando bot ${botId} no banco...`)

    // Converter ignoreJids de array para string se necessário
    let updatePayload = { ...botData }
    if (botData.ignoreJids && Array.isArray(botData.ignoreJids)) {
      updatePayload.ignoreJids = (botData.ignoreJids as any).join(",") + ","
    }

    const { text, values } = buildUpdate("bots", updatePayload, { id: botId })
    const updatedBot = await queryOne<Bot>(text, values)

    if (!updatedBot) {
      console.error("❌ [UAZAPI-BOT] Erro ao atualizar bot ou bot não encontrado")
      return {
        success: false,
        error: "Erro ao atualizar bot ou bot não encontrado",
      }
    }

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
}: UpdateBotWebhookParams): Promise<UpdateBotResult> {
  try {
    console.log(`🔄 [UAZAPI-BOT] Atualizando webhook do bot ${botId}...`)

    // 1. Buscar bot atual para obter webhook_id antigo
    const currentBot = await queryOne<any>(
      `SELECT * FROM bots WHERE id = $1 LIMIT 1`,
      [botId]
    )

    if (!currentBot) {
      return {
        success: false,
        error: "Bot não encontrado",
      }
    }

    // 2. Buscar conexão WhatsApp
    const connection = await queryOne<any>(
      `SELECT * FROM whatsapp_connections WHERE id = $1 LIMIT 1`,
      [connectionId]
    )

    if (!connection) {
      return {
        success: false,
        error: "Conexão WhatsApp não encontrada",
      }
    }

    // 3. Buscar configuração Uazapi
    const integration = await queryOne<{ config: any }>(
      `SELECT config FROM integrations WHERE type = $1 AND is_active = true LIMIT 1`,
      ["uazapi"]
    )

    if (!integration) {
      return {
        success: false,
        error: "Uazapi não configurada",
      }
    }

    const uazapiConfig =
      typeof integration.config === "string"
        ? JSON.parse(integration.config)
        : integration.config

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

