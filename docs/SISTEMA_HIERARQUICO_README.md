# Sistema Hierárquico Multi-Tenant - IMPA AI

## 📋 Visão Geral

Sistema completo de gerenciamento hierárquico com três níveis de acesso:
- **Super Admin**: Controle total do sistema, gerencia empresas e define limites
- **Company Admin (Admin)**: Gerencia todos os recursos da sua empresa
- **Usuário**: Acesso limitado aos recursos que o admin liberar

## 🏗️ Arquitetura

### Hierarquia de Usuários

```
Super Admin (Controla tudo)
    ├── Empresa A
    │   ├── Admin A (Gerencia Empresa A)
    │   │   ├── Usuário A1
    │   │   ├── Usuário A2
    │   │   └── Usuário A3
    │   └── Recursos da Empresa A
    │       ├── Agentes
    │       ├── Conexões
    │       └── Integrações
    │
    └── Empresa B
        ├── Admin B (Gerencia Empresa B)
        │   ├── Usuário B1
        │   └── Usuário B2
        └── Recursos da Empresa B
```

## 🗄️ Estrutura do Banco de Dados

### Novas Tabelas Criadas

#### 1. `impaai.companies`
Armazena dados das empresas e seus limites de recursos.

**Campos principais:**
- `id` - UUID único da empresa
- `name` - Nome da empresa
- `email` - Email principal
- `status` - active, suspended, trial, inactive
- `subscription_plan` - basic, pro, enterprise, custom
- **Limites de recursos:**
  - `max_users` - Máximo de usuários
  - `max_agents` - Máximo de agentes IA
  - `max_connections` - Máximo de conexões WhatsApp
  - `max_integrations` - Máximo de integrações
  - `max_monthly_messages` - Mensagens mensais permitidas

#### 2. `impaai.company_resource_usage`
Rastreia o uso de recursos por empresa mensalmente.

#### 3. `impaai.company_activity_logs`
Registra todas as atividades realizadas na empresa.

### Tabelas Modificadas

Todas as tabelas principais receberam `company_id`:
- `user_profiles` - Usuário pertence a uma empresa
- `ai_agents` - Agentes pertencem a uma empresa
- `whatsapp_connections` - Conexões pertencem a uma empresa
- `integrations` - Integrações pertencem a uma empresa
- `llm_api_keys` - API keys pertencem a uma empresa

## 🔑 Permissões e Roles

### Super Admin
✅ Acesso total ao sistema
✅ Criar, editar e deletar empresas
✅ Definir limites de recursos para cada empresa
✅ Ver estatísticas globais
✅ Suspender/reativar empresas
✅ Gerenciar qualquer recurso de qualquer empresa

### Admin (Company Admin)
✅ Acesso total aos recursos da sua empresa
✅ Criar, editar e deletar usuários da empresa
✅ Gerenciar agentes, conexões e integrações
✅ Ver estatísticas da empresa
✅ Configurar preferências da empresa
❌ NÃO pode alterar limites de recursos (definido pelo Super Admin)
❌ NÃO pode acessar outras empresas

### User (Usuário)
✅ Acesso aos recursos que o admin liberar
✅ Ver estatísticas pessoais
✅ Gerenciar seus próprios agentes (se permitido)
❌ NÃO pode criar outros usuários
❌ NÃO pode ver dados de outros usuários (a menos que permitido)

## 🚀 APIs Implementadas

### Gerenciamento de Empresas

```typescript
// Listar empresas (Super Admin)
GET /api/companies
Query params: page, per_page, status, search

// Criar empresa (Super Admin)
POST /api/companies
Body: { name, email, max_users, max_agents, ... }

// Buscar empresa específica
GET /api/companies/[id]

// Atualizar empresa
PUT /api/companies/[id]
// Super Admin: pode alterar tudo
// Admin: pode alterar dados, mas não limites

// Deletar empresa (Super Admin)
DELETE /api/companies/[id]
```

### Limites de Recursos

```typescript
// Verificar todos os limites da empresa
GET /api/companies/[id]/limits
Response: {
  users: { current: 5, max: 10, can_create: true, usage_percent: 50 },
  agents: { current: 8, max: 10, can_create: true, usage_percent: 80 },
  ...
}

// Verificar limite específico antes de criar
POST /api/companies/[id]/limits
Body: { resource_type: "users" }
Response: { can_create: true }

// Atualizar limites (Super Admin)
PUT /api/companies/[id]/limits
Body: { max_users: 20, max_agents: 50, ... }
```

### Usuários da Empresa

```typescript
// Listar usuários da empresa
GET /api/companies/[id]/users

// Criar usuário na empresa
POST /api/companies/[id]/users
Body: {
  full_name, email, password, role,
  can_create_users, can_manage_company,
  agents_limit, connections_limit
}
```

### Estatísticas

```typescript
// Dashboard do Super Admin
GET /api/super-admin/dashboard
Response: {
  companies_stats: { total, active, suspended, ... },
  global_stats: { total_users, total_agents, ... },
  recent_companies, recent_activities,
  critical_resources, expiring_companies
}

// Estatísticas da empresa
GET /api/companies/[id]/stats
Response: {
  stats, recent_activities, resource_usage,
  agents_stats, connections_stats, approaching_limits
}
```

## 📊 Funcionalidades do Sistema

### Para Super Admin

1. **Dashboard Global**
   - Total de empresas, usuários, agentes, conexões
   - Empresas criadas recentemente
   - Atividades do sistema
   - Alertas de recursos críticos

2. **Gerenciamento de Empresas**
   - Criar nova empresa
   - Editar dados da empresa
   - Definir limites de recursos
   - Suspender/reativar empresa
   - Deletar empresa

3. **Monitoramento**
   - Ver uso de recursos de cada empresa
   - Identificar empresas próximas do limite
   - Empresas com assinatura expirando

### Para Company Admin

1. **Dashboard da Empresa**
   - Estatísticas de uso
   - Usuários ativos
   - Agentes e conexões
   - Alertas de limite

2. **Gerenciamento de Usuários**
   - Criar usuário
   - Definir permissões
   - Definir limites individuais
   - Desativar usuário

3. **Gerenciamento de Recursos**
   - Criar/editar agentes (respeitando limites)
   - Criar/editar conexões (respeitando limites)
   - Ver relatórios

### Para Usuário

1. **Dashboard Pessoal**
   - Seus agentes
   - Suas conexões
   - Estatísticas pessoais

2. **Recursos Permitidos**
   - Criar agentes (se permitido e dentro do limite)
   - Criar conexões (se permitido e dentro do limite)

## 🔒 Sistema de Segurança

### Verificação de Limites

Antes de criar qualquer recurso, o sistema verifica:

```typescript
// Função no banco de dados
check_company_resource_limit(company_id, resource_type)

// Retorna true/false se pode criar
```

### Logs de Atividade

Todas as ações importantes são registradas:

```typescript
{
  company_id: "uuid",
  user_id: "uuid",
  action: "user_created",
  resource_type: "user",
  resource_id: "uuid",
  description: "Usuário João criado",
  metadata: { ... },
  ip_address: "192.168.1.1",
  created_at: "2024-01-01"
}
```

## 📦 Como Usar

### 1. Executar Migração SQL

```bash
psql -U seu_usuario -d seu_banco -f database/migrations/001_add_companies_and_hierarchy.sql
```

Isso irá:
- Criar tabelas `companies`, `company_resource_usage`, `company_activity_logs`
- Adicionar `company_id` às tabelas existentes
- Criar funções de verificação de limites
- Criar views de estatísticas
- Migrar dados existentes para empresa padrão
- Criar primeiro super admin

### 2. Criar Primeiro Super Admin

O primeiro admin cadastrado será promovido a super_admin automaticamente. Ou execute:

```sql
UPDATE impaai.user_profiles
SET role = 'super_admin',
    can_create_users = true,
    can_manage_company = true
WHERE email = 'seu-email@exemplo.com';
```

### 3. Usar APIs

Configure o token JWT nos headers:

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### 4. Exemplo: Criar Empresa

```typescript
const response = await fetch('/api/companies', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Minha Empresa LTDA',
    email: 'contato@minhaempresa.com',
    max_users: 10,
    max_agents: 20,
    max_connections: 15,
    max_integrations: 5,
    max_monthly_messages: 50000,
    subscription_plan: 'pro'
  })
});

const company = await response.json();
```

### 5. Exemplo: Criar Usuário na Empresa

```typescript
const response = await fetch(`/api/companies/${companyId}/users`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'João Silva',
    email: 'joao@minhaempresa.com',
    password: 'senhaSegura123',
    role: 'admin',
    can_create_users: true,
    agents_limit: 5,
    connections_limit: 5
  })
});
```

## 🎨 Componentes UI

### Super Admin Panel
`components/super-admin-companies-panel.tsx`

Features:
- Lista de empresas com filtros
- Cards de estatísticas globais
- Alertas de recursos críticos
- Ações rápidas (ver, editar, deletar)

## 📈 Monitoramento

### View de Estatísticas

```sql
-- Ver estatísticas de todas as empresas
SELECT * FROM impaai.company_stats;

-- Ver empresas próximas do limite
SELECT * FROM impaai.company_stats
WHERE users_usage_percent >= 80
   OR agents_usage_percent >= 80
   OR connections_usage_percent >= 80;
```

### Atualizar Uso de Recursos

```sql
-- Atualizar contadores do mês atual
SELECT impaai.update_company_resource_usage('company-id');
```

## 🔄 Fluxo de Trabalho

### Criação de Empresa pelo Super Admin

1. Super Admin acessa `/api/companies`
2. Preenche dados da empresa e define limites
3. Sistema cria empresa e registra log
4. Admin da empresa pode começar a criar usuários

### Criação de Usuário pelo Admin

1. Admin acessa `/api/companies/[id]/users`
2. Sistema verifica limite de usuários
3. Se OK, cria usuário e incrementa contador
4. Registra log de atividade
5. Atualiza estatísticas da empresa

### Criação de Agente por Usuário

1. Usuário tenta criar agente
2. Sistema verifica:
   - Limite da empresa
   - Limite individual do usuário
   - Permissões do usuário
3. Se tudo OK, cria agente
4. Registra log
5. Atualiza contadores

## 🛠️ Manutenção

### Verificar Saúde do Sistema

```sql
-- Empresas com problemas
SELECT * FROM impaai.company_stats
WHERE current_users > max_users
   OR current_agents > max_agents;

-- Logs de erro recentes
SELECT * FROM impaai.company_activity_logs
WHERE action LIKE '%error%'
ORDER BY created_at DESC
LIMIT 50;
```

### Backup de Dados

```bash
# Backup completo
pg_dump -U usuario -d banco > backup_$(date +%Y%m%d).sql

# Backup apenas das novas tabelas
pg_dump -U usuario -d banco -t impaai.companies -t impaai.company_resource_usage -t impaai.company_activity_logs > backup_companies.sql
```

## 📝 Próximos Passos

- [ ] Implementar sistema de billing/cobrança
- [ ] Adicionar webhooks para eventos da empresa
- [ ] Criar relatórios personalizados
- [ ] Implementar notificações quando próximo do limite
- [ ] Sistema de upgrade automático de planos
- [ ] API de white-label para empresas

## 🆘 Troubleshooting

### Erro: "Limite atingido"
Verifique os limites da empresa e atualize se necessário (Super Admin).

### Erro: "Acesso negado"
Verifique a role do usuário e permissions.

### Logs não aparecem
Verifique se a função `logActivity` está sendo chamada corretamente.

## 📞 Suporte

Para dúvidas ou problemas, contate o time de desenvolvimento.
