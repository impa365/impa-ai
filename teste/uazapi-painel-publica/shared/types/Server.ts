// Tipos relacionados a servidores
export interface Server {
  id: string
  nome: string
  serverUrl: string
  adminToken?: string
  status: 'online' | 'offline' | 'maintenance'
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateServerRequest {
  nome: string
  serverUrl: string
  adminToken?: string
}

export interface UpdateServerRequest extends Partial<CreateServerRequest> {
  id: string
}
