# 🎯 SISTEMA COMPLETO - ImpaAI com Autenticação Customizada

## ✅ ENTENDIMENTO DA ARQUITETURA ATUAL

### **Sistema de Autenticação**
Você está usando **autenticação customizada** (NÃO usa Supabase Auth):

- ✅ Tabela: `impaai.user_profiles`
- ✅ Campos principais:
  - `id` (UUID gerado automaticamente)
  - `email` (único)
  - `password` (hash bcrypt)
  - `role` ('user', 'admin', 'super_admin')
  - `status` ('active', 'inactive', 'suspended')
  - `company` (campo texto simples - será substituído por `company_id` UUID)
- ✅ Funções: `custom_login()` e `custom_register()` no PostgreSQL
- ✅ API: `/api/auth/login` e `/api/auth/register`

### **Novos Recursos Implementados**

1. **Tabela `companies`** - Empresas com limites de recursos
2. **Hierarquia completa**: Super Admin → Empresas → Admins → Usuários
3. **Limites por empresa**: usuários, instâncias, conexões, agentes
4. **Painel Super Admin**: `/super-admin`
5. **APIs completas** para gerenciar tudo

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **1. Executar Migrações SQL** ✅ PRONTO PARA EXECUTAR

```bash
# Execute na ordem, via Supabase Dashboard ou script:
psql -h seu-host -U postgres -d postgres -f database/migrations/001_add_companies_and_hierarchy.sql
psql -h seu-host -U postgres -d postgres -f database/migrations/002_update_existing_tables.sql
```

**O que as migrações fazem:**
- ✅ Criam tabela `companies`
- ✅ Adicionam `company_id` em `user_profiles`
- ✅ Adicionam `company_id` em `whatsapp_connections`
- ✅ Adicionam `permissions` (JSONB) em `user_profiles`
- ✅ Criam empresas automaticamente para admins existentes
- ✅ Criam triggers para validar limites
- ✅ Criam funções para estatísticas

### **2. Criar Primeiro Super Admin** ✅ PRONTO

**Opção A: Via SQL (Recomendado)**
```sql
-- Execute: database/seeds/001_create_super_admin.sql
-- Email: superadmin@impaai.com
-- Senha: SuperAdmin@2024!
```

**Opção B: Via API + SQL Manual**
```javascript
// 1. Registre via API normal
await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    email: 'superadmin@impaai.com',
    password: 'SuperAdmin@2024!',
    full_name: 'Super Administrador'
  })
})

// 2. Depois execute no SQL:
UPDATE impaai.user_profiles 
SET role = 'super_admin', company_id = NULL 
WHERE email = 'superadmin@impaai.com';
```

### **3. Integrar Validação de Limites nas APIs Existentes**

#### **a) API de Criação de Conexões WhatsApp**

Localize: `app/api/whatsapp/connections/route.ts` (ou similar)

```typescript
import { validateCompanyLimitMiddleware } from "@/lib/company-limits"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  // ✅ ADICIONE ESTA VALIDAÇÃO
  const limitCheck = await validateCompanyLimitMiddleware(
    request,
    "connections"
  )
  if (limitCheck) return limitCheck

  // ... resto do código de criação de conexão
}
```

#### **b) API de Criação de Agentes**

Localize: `app/api/agents/route.ts` ou `app/api/admin/agents/route.ts`

```typescript
import { validateCompanyLimitMiddleware } from "@/lib/company-limits"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  // ✅ ADICIONE ESTA VALIDAÇÃO
  const limitCheck = await validateCompanyLimitMiddleware(
    request,
    "agents"
  )
  if (limitCheck) return limitCheck

  // ... resto do código de criação de agente
}
```

#### **c) API de Criação de Usuários**

Localize: `app/api/admin/users/route.ts`

```typescript
import { validateCompanyLimitMiddleware } from "@/lib/company-limits"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  // ✅ ADICIONE ESTA VALIDAÇÃO
  const limitCheck = await validateCompanyLimitMiddleware(
    request,
    "users"
  )
  if (limitCheck) return limitCheck

  // ... resto do código de criação de usuário
}
```

### **4. Adicionar Filtros por `company_id` nas Queries**

Em **TODAS as APIs que buscam dados**, adicione o filtro:

```typescript
// ❌ ANTES
const { data } = await supabase
  .from('whatsapp_connections')
  .select('*')
  .eq('user_id', user.id)

// ✅ DEPOIS
const { data } = await supabase
  .from('whatsapp_connections')
  .select('*')
  .eq('user_id', user.id)
  .eq('company_id', user.company_id) // ← ADICIONE ESTE FILTRO

// Para super admins (que não têm company_id):
if (user.role === 'super_admin') {
  // Sem filtro - vê tudo
  query = supabase.from('whatsapp_connections').select('*')
} else {
  // Com filtro de empresa
  query = supabase.from('whatsapp_connections')
    .select('*')
    .eq('company_id', user.company_id)
}
```

**Arquivos que provavelmente precisam de atualização:**
- `app/api/whatsapp/connections/route.ts`
- `app/api/agents/route.ts`
- `app/api/admin/dashboard/route.ts`
- Qualquer API que liste recursos do usuário

### **5. Atualizar Criação de Recursos com `company_id`**

Em **TODAS as APIs que CRIAM dados**, adicione o company_id:

```typescript
// ❌ ANTES
await supabase.from('whatsapp_connections').insert({
  user_id: user.id,
  connection_name: name,
  // ...
})

// ✅ DEPOIS
await supabase.from('whatsapp_connections').insert({
  user_id: user.id,
  company_id: user.company_id, // ← ADICIONE
  connection_name: name,
  // ...
})
```

### **6. Adicionar Rota no Menu/Navegação**

Localize seu componente de navegação (provavelmente em `app/layout.tsx` ou componente de menu):

```typescript
// Adicione link para super admin
{user?.role === 'super_admin' && (
  <Link href="/super-admin">
    <Button className="gap-2">
      <Building2 className="w-4 h-4" />
      Painel Super Admin
    </Button>
  </Link>
)}
```

### **7. Atualizar Middleware Global (se existir)**

Se você tem um `middleware.ts` na raiz:

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/super-admin/:path*', // ← ADICIONE
  ],
}
```

## 🔧 ARQUIVOS CRIADOS

### **Banco de Dados**
- ✅ `database/migrations/001_add_companies_and_hierarchy.sql`
- ✅ `database/migrations/002_update_existing_tables.sql`
- ✅ `database/seeds/001_create_super_admin.sql`

### **Backend/APIs**
- ✅ `app/api/super-admin/companies/route.ts`
- ✅ `app/api/super-admin/companies/[id]/route.ts`
- ✅ `app/api/super-admin/companies/[id]/users/route.ts`
- ✅ `app/api/super-admin/dashboard/route.ts`
- ✅ `app/api/companies/limits/route.ts`
- ✅ `app/api/companies/stats/route.ts`

### **Frontend**
- ✅ `app/super-admin/page.tsx`
- ✅ `components/company-management-panel.tsx`
- ✅ `components/company-users-management.tsx`

### **Utilitários**
- ✅ `lib/authorization.ts`
- ✅ `lib/company-limits.ts`
- ✅ `types/company.ts`
- ✅ `types/company-limits.ts`

## ⚠️ PONTOS DE ATENÇÃO

### **1. Campo `company` vs `company_id`**
- ❌ `company` (VARCHAR) - campo texto simples antigo
- ✅ `company_id` (UUID) - novo campo com FK para tabela companies
- Após migração, você pode manter ambos ou remover o antigo

### **2. Super Admins**
- ✅ `role = 'super_admin'`
- ✅ `company_id = NULL` (não pertencem a nenhuma empresa)
- ✅ Acesso total a todas as empresas
- ✅ Únicos que podem criar empresas

### **3. Admins de Empresa**
- ✅ `role = 'admin'`
- ✅ `company_id = [UUID da empresa]`
- ✅ Acesso total dentro da sua empresa
- ✅ Podem gerenciar usuários da empresa

### **4. Usuários Regulares**
- ✅ `role = 'user'`
- ✅ `company_id = [UUID da empresa]`
- ✅ `permissions = []` (array de permissões específicas)
- ✅ Acesso limitado conforme permissões

### **5. Hierarquia Completa**
```
Super Admin (company_id = NULL)
    └─ Empresa A (company_id = uuid-a)
        ├─ Admin A (role = admin, company_id = uuid-a)
        ├─ User A1 (role = user, company_id = uuid-a, permissions = [...])
        └─ User A2 (role = user, company_id = uuid-a, permissions = [...])
    └─ Empresa B (company_id = uuid-b)
        ├─ Admin B (role = admin, company_id = uuid-b)
        └─ User B1 (role = user, company_id = uuid-b, permissions = [...])
```

## 🚀 ORDEM DE EXECUÇÃO

1. ✅ **Backup do banco de dados** (SEMPRE!)
2. ✅ **Executar migração 001**
3. ✅ **Executar migração 002**
4. ✅ **Executar seed 001** (criar super admin)
5. ✅ **Testar login** como super admin
6. ✅ **Acessar** `/super-admin`
7. ✅ **Criar primeira empresa**
8. ✅ **Adicionar validações** nas APIs existentes
9. ✅ **Adicionar filtros** company_id nas queries
10. ✅ **Testar** criação de recursos com limites

## 📚 COMO TESTAR

### **1. Testar Super Admin**
```bash
# 1. Login como super admin
POST /api/auth/login
{
  "email": "superadmin@impaai.com",
  "password": "SuperAdmin@2024!"
}

# 2. Acessar painel
GET /super-admin

# 3. Criar empresa
POST /api/super-admin/companies
{
  "name": "Empresa Teste",
  "max_users": 10,
  "max_connections": 5,
  "max_instances": 3,
  "max_agents": 15
}
```

### **2. Testar Limites**
```bash
# Tente criar mais conexões que o limite
# Deve retornar erro 403 com mensagem de limite atingido
```

### **3. Testar Isolamento**
```bash
# Login como admin da Empresa A
# Tente listar recursos - deve ver apenas da Empresa A
# Não deve ver recursos da Empresa B
```

## 🔐 SEGURANÇA

- ✅ Triggers no banco validam limites automaticamente
- ✅ Middleware valida antes de criar recursos
- ✅ Super admins não podem ser criados por registro normal
- ✅ Filtros por company_id garantem isolamento de dados
- ✅ RLS (Row Level Security) pode ser adicionado para camada extra

## 📞 PRÓXIMOS PASSOS

1. **Execute as migrações**
2. **Crie o super admin**
3. **Adicione as validações nas APIs**
4. **Teste tudo**
5. **Ajuste os limites padrão** conforme necessário

---

**Dúvidas?** Consulte:
- `SUPER_ADMIN_SYSTEM_README.md` - Documentação técnica completa
- `SUPER_ADMIN_QUICK_START.md` - Guia rápido
