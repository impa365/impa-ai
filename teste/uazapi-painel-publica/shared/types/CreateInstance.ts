export interface CreateInstanceRequest {
  name: string
  systemName?: string
  adminField01?: string
  adminField02?: string
}

export interface CreateInstanceModalProps {
  adminToken: string
  serverUrl: string
}
