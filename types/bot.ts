/**
 * Tipos TypeScript para o sistema de Bots customizados (Uazapi)
 */

export type TipoGatilho = 'Palavra-chave' | 'Todos' | 'Avançado' | 'Nenhum'

export type OperadorGatilho = 'Contém' | 'Igual' | 'Começa Com' | 'Termina Com' | 'Regex'

export interface Bot {
  id: string
  nome: string
  url_api: string
  apikey?: string | null
  gatilho: TipoGatilho
  operador_gatilho: OperadorGatilho
  value_gatilho?: string | null
  debounce: number
  splitMessage: number
  ignoreJids: string
  webhook_id?: string | null
  user_id: string
  connection_id: string
  padrao: boolean // Bot padrão da conexão (usado no n8n)
  created_at: string
  updated_at: string
}

export interface CreateBotPayload {
  nome: string
  url_api: string
  apikey?: string
  gatilho: TipoGatilho
  operador_gatilho?: OperadorGatilho
  value_gatilho?: string
  debounce?: number
  splitMessage?: number
  ignoreJids?: string
  user_id: string
  connection_id: string
}

export interface UpdateBotPayload {
  nome?: string
  url_api?: string
  apikey?: string
  gatilho?: TipoGatilho
  operador_gatilho?: OperadorGatilho
  value_gatilho?: string
  debounce?: number
  splitMessage?: number
  ignoreJids?: string
  webhook_id?: string
}

export interface BotSession {
  sessionId: string
  remoteJid: string
  status: boolean
  ultimo_status: string
  criado_em: string
  bot_id: string
  connection_id: string
  deleted_at: string | null  // NULL = Ativa/Pausada, timestamp = Inativa
}

