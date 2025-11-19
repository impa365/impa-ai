// Tipos para gerenciamento de webhooks

export type WebhookEvent = 
  | 'connection'
  | 'history'
  | 'messages'
  | 'messages_update'
  | 'call'
  | 'contacts'
  | 'presence'
  | 'groups'
  | 'labels'
  | 'chats'
  | 'chat_labels'
  | 'blocks'
  | 'leads'
  | 'sender'

export type ExcludeMessageFilter = 
  | 'wasSentByApi'
  | 'wasNotSentByApi'
  | 'fromMeYes'
  | 'fromMeNo'
  | 'isGroupYes'
  | 'isGroupNo'

export type WebhookAction = 'add' | 'update' | 'delete'

export interface WebhookConfig {
  id?: string
  enabled: boolean
  url: string
  events: WebhookEvent[]
  excludeMessages?: ExcludeMessageFilter[]
  addUrlEvents?: boolean
  addUrlTypesMessages?: boolean
  action?: WebhookAction
}

export interface CreateWebhookRequest {
  url: string
  events: WebhookEvent[]
  excludeMessages?: ExcludeMessageFilter[]
  addUrlEvents?: boolean
  addUrlTypesMessages?: boolean
  enabled?: boolean
}

export interface WebhookResponse {
  id: string
  enabled: boolean
  url: string
  events: WebhookEvent[]
  excludeMessages?: ExcludeMessageFilter[]
  addUrlEvents?: boolean
  addUrlTypesMessages?: boolean
  createdAt?: string
  updatedAt?: string
}
