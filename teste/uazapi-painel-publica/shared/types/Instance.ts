// Tipos relacionados a instâncias
export interface Instance {
  id: string
  token: string
  status: string
  paircode?: string
  qrcode?: string
  name: string
  profileName?: string
  profilePicUrl?: string
  isBusiness: boolean
  plataform?: string
  systemName: string
  owner: string
  lastDisconnect?: string
  lastDisconnectReason?: string
  adminField01?: string
  adminField02?: string
  openai_apikey?: string
  chatbot_enabled?: boolean
  chatbot_ignoreGroups?: boolean
  chatbot_stopConversation?: string
  chatbot_stopMinutes?: number
  created: string
  updated?: string
  delayMin?: number
  delayMax?: number
  info?: string
}

export interface InstancesResponse {
  error?: string
  data?: Instance[]
}
