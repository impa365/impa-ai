// ================================================
// Types para Sistema de Empresas e Multi-tenancy
// ================================================

export type CompanyStatus = 'active' | 'suspended' | 'trial' | 'inactive';
export type SubscriptionPlan = 'basic' | 'pro' | 'enterprise' | 'custom';
export type UserRole = 'super_admin' | 'admin' | 'user';

// Interface principal de Company
export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  
  // Informações da empresa
  document?: string; // CNPJ/CPF
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  
  // Limites de recursos
  max_users: number;
  max_agents: number;
  max_connections: number;
  max_integrations: number;
  max_monthly_messages: number;
  
  // Recursos customizados
  resource_limits?: Record<string, any>;
  
  // Status e assinatura
  status: CompanyStatus;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at?: string;
  
  // Branding
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  
  // Configurações
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Estatísticas da empresa
export interface CompanyStats {
  company_id: string;
  company_name: string;
  status: CompanyStatus;
  subscription_plan: SubscriptionPlan;
  
  // Uso atual
  current_users: number;
  current_agents: number;
  current_connections: number;
  current_integrations: number;
  
  // Limites
  max_users: number;
  max_agents: number;
  max_connections: number;
  max_integrations: number;
  max_monthly_messages: number;
  
  // Percentuais de uso
  users_usage_percent: number;
  agents_usage_percent: number;
  connections_usage_percent: number;
  integrations_usage_percent: number;
  
  created_at: string;
  updated_at: string;
}

// Uso de recursos da empresa
export interface CompanyResourceUsage {
  id: string;
  company_id: string;
  
  // Contadores
  total_users: number;
  total_agents: number;
  total_connections: number;
  total_integrations: number;
  monthly_messages: number;
  
  // Período
  period_start: string;
  period_end: string;
  
  details?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

// Log de atividades da empresa
export interface CompanyActivityLog {
  id: string;
  company_id: string;
  user_id?: string;
  
  action: string;
  resource_type?: string;
  resource_id?: string;
  
  description?: string;
  metadata?: Record<string, any>;
  
  ip_address?: string;
  user_agent?: string;
  
  created_at: string;
}

// User Profile estendido com company
export interface UserProfileWithCompany {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: string;
  
  // Empresa
  company_id?: string;
  company?: Company;
  
  // Permissões
  can_create_users: boolean;
  can_manage_company: boolean;
  custom_permissions?: Record<string, any>;
  
  // Limites individuais (herdados ou customizados)
  agents_limit: number;
  connections_limit: number;
  monthly_messages_limit: number;
  
  // Outros campos
  avatar_url?: string;
  phone?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  preferences?: Record<string, any>;
  theme_settings?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

// DTOs para criação e atualização
export interface CreateCompanyDTO {
  name: string;
  email: string;
  phone?: string;
  
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  
  // Limites de recursos
  max_users?: number;
  max_agents?: number;
  max_connections?: number;
  max_integrations?: number;
  max_monthly_messages?: number;
  
  resource_limits?: Record<string, any>;
  
  status?: CompanyStatus;
  subscription_plan?: SubscriptionPlan;
  subscription_expires_at?: string;
  
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateCompanyDTO extends Partial<CreateCompanyDTO> {
  id: string;
}

// DTO para atualizar limites de recursos
export interface UpdateCompanyLimitsDTO {
  company_id: string;
  max_users?: number;
  max_agents?: number;
  max_connections?: number;
  max_integrations?: number;
  max_monthly_messages?: number;
  resource_limits?: Record<string, any>;
}

// DTO para criar usuário em uma empresa
export interface CreateCompanyUserDTO {
  company_id: string;
  full_name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  
  can_create_users?: boolean;
  can_manage_company?: boolean;
  
  agents_limit?: number;
  connections_limit?: number;
  monthly_messages_limit?: number;
}

// Response types
export interface CompanyListResponse {
  companies: Company[];
  total: number;
  page: number;
  per_page: number;
}

export interface CompanyWithStats extends Company {
  stats: CompanyStats;
}

// Filtros e queries
export interface CompanyFilters {
  status?: CompanyStatus;
  subscription_plan?: SubscriptionPlan;
  search?: string;
  created_after?: string;
  created_before?: string;
}

export interface CompanyQuery {
  filters?: CompanyFilters;
  page?: number;
  per_page?: number;
  sort_by?: 'name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

// Verificação de limites
export interface ResourceLimitCheck {
  company_id: string;
  resource_type: 'users' | 'agents' | 'connections' | 'integrations' | 'messages';
  current_count: number;
  max_limit: number;
  can_create: boolean;
  usage_percent: number;
}

// Dashboard data para Super Admin
export interface SuperAdminDashboard {
  total_companies: number;
  active_companies: number;
  suspended_companies: number;
  trial_companies: number;
  
  total_users: number;
  total_agents: number;
  total_connections: number;
  total_integrations: number;
  
  monthly_revenue?: number;
  
  recent_companies: Company[];
  recent_activities: CompanyActivityLog[];
  
  resource_usage_overview: {
    company_id: string;
    company_name: string;
    users: { current: number; max: number; percent: number };
    agents: { current: number; max: number; percent: number };
    connections: { current: number; max: number; percent: number };
  }[];
}

// Dashboard data para Company Admin
export interface CompanyAdminDashboard {
  company: Company;
  stats: CompanyStats;
  
  users: UserProfileWithCompany[];
  recent_activities: CompanyActivityLog[];
  resource_usage: CompanyResourceUsage;
  
  agents_count: number;
  connections_count: number;
  integrations_count: number;
  
  approaching_limits: {
    resource: string;
    current: number;
    max: number;
    percent: number;
  }[];
}

// Configurações de permissões
export interface Permission {
  key: string;
  name: string;
  description: string;
  category: 'users' | 'agents' | 'connections' | 'integrations' | 'company' | 'settings';
}

export const PERMISSIONS: Permission[] = [
  // Usuários
  { key: 'users.view', name: 'Ver Usuários', description: 'Pode visualizar lista de usuários', category: 'users' },
  { key: 'users.create', name: 'Criar Usuários', description: 'Pode criar novos usuários', category: 'users' },
  { key: 'users.edit', name: 'Editar Usuários', description: 'Pode editar usuários existentes', category: 'users' },
  { key: 'users.delete', name: 'Deletar Usuários', description: 'Pode deletar usuários', category: 'users' },
  
  // Agentes
  { key: 'agents.view', name: 'Ver Agentes', description: 'Pode visualizar agentes', category: 'agents' },
  { key: 'agents.create', name: 'Criar Agentes', description: 'Pode criar novos agentes', category: 'agents' },
  { key: 'agents.edit', name: 'Editar Agentes', description: 'Pode editar agentes', category: 'agents' },
  { key: 'agents.delete', name: 'Deletar Agentes', description: 'Pode deletar agentes', category: 'agents' },
  
  // Conexões
  { key: 'connections.view', name: 'Ver Conexões', description: 'Pode visualizar conexões', category: 'connections' },
  { key: 'connections.create', name: 'Criar Conexões', description: 'Pode criar novas conexões', category: 'connections' },
  { key: 'connections.edit', name: 'Editar Conexões', description: 'Pode editar conexões', category: 'connections' },
  { key: 'connections.delete', name: 'Deletar Conexões', description: 'Pode deletar conexões', category: 'connections' },
  
  // Integrações
  { key: 'integrations.view', name: 'Ver Integrações', description: 'Pode visualizar integrações', category: 'integrations' },
  { key: 'integrations.create', name: 'Criar Integrações', description: 'Pode criar integrações', category: 'integrations' },
  { key: 'integrations.edit', name: 'Editar Integrações', description: 'Pode editar integrações', category: 'integrations' },
  { key: 'integrations.delete', name: 'Deletar Integrações', description: 'Pode deletar integrações', category: 'integrations' },
  
  // Empresa
  { key: 'company.view', name: 'Ver Empresa', description: 'Pode ver dados da empresa', category: 'company' },
  { key: 'company.edit', name: 'Editar Empresa', description: 'Pode editar dados da empresa', category: 'company' },
  { key: 'company.billing', name: 'Gerenciar Faturamento', description: 'Pode gerenciar planos e pagamentos', category: 'company' },
  
  // Configurações
  { key: 'settings.view', name: 'Ver Configurações', description: 'Pode ver configurações', category: 'settings' },
  { key: 'settings.edit', name: 'Editar Configurações', description: 'Pode editar configurações', category: 'settings' },
];

// Helper para verificar permissões
export function hasPermission(user: UserProfileWithCompany, permission: string): boolean {
  // Super admin tem todas as permissões
  if (user.role === 'super_admin') return true;
  
  // Admin tem todas as permissões dentro da empresa
  if (user.role === 'admin') {
    // Exceto gerenciar limites da própria empresa (só super admin)
    if (permission === 'company.limits') return false;
    return true;
  }
  
  // Usuário normal verifica permissões customizadas
  if (user.custom_permissions && user.custom_permissions[permission]) {
    return true;
  }
  
  return false;
}

// Helper para verificar se pode criar recurso
export function canCreateResource(
  company: Company,
  stats: CompanyStats,
  resourceType: 'users' | 'agents' | 'connections' | 'integrations'
): { can: boolean; reason?: string } {
  const currentKey = `current_${resourceType}` as keyof CompanyStats;
  const maxKey = `max_${resourceType}` as keyof Company;
  
  const current = stats[currentKey] as number;
  const max = company[maxKey] as number;
  
  if (current >= max) {
    return {
      can: false,
      reason: `Limite de ${resourceType} atingido (${current}/${max})`,
    };
  }
  
  return { can: true };
}
