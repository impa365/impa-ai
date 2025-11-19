# 🚀 Guia Rápido - Sistema Hierárquico

## Instalação em 5 Passos

### 1. Execute a Migração SQL

**Windows (PowerShell):**
```powershell
.\scripts\migrate-hierarchy.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/migrate-hierarchy.sh
./scripts/migrate-hierarchy.sh
```

**Ou manualmente:**
```bash
psql $DATABASE_URL -f database/migrations/001_add_companies_and_hierarchy.sql
```

### 2. Criar Primeiro Super Admin

**Via SQL:**
```sql
-- Promover usuário existente
UPDATE impaai.user_profiles
SET role = 'super_admin',
    can_create_users = true,
    can_manage_company = true
WHERE email = 'seu-email@exemplo.com';

-- Ou criar novo Super Admin
INSERT INTO impaai.user_profiles (
    full_name, email, password, role,
    can_create_users, can_manage_company
) VALUES (
    'Super Admin',
    'admin@impaai.com',
    crypt('senha-segura', gen_salt('bf')),
    'super_admin',
    true,
    true
);
```

### 3. Criar Empresa via API

```bash
curl -X POST http://localhost:3000/api/companies \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Minha Empresa LTDA",
    "email": "contato@minhaempresa.com",
    "max_users": 10,
    "max_agents": 20,
    "max_connections": 15,
    "max_integrations": 5,
    "max_monthly_messages": 50000,
    "subscription_plan": "pro"
  }'
```

### 4. Criar Admin da Empresa

```bash
curl -X POST http://localhost:3000/api/companies/COMPANY_ID/users \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "João Silva",
    "email": "joao@minhaempresa.com",
    "password": "senhaSegura123",
    "role": "admin",
    "can_create_users": true,
    "can_manage_company": true
  }'
```

### 5. Acessar Painéis

- **Super Admin**: `http://localhost:3000/super-admin`
- **Company Admin**: `http://localhost:3000/admin`
- **Usuário**: `http://localhost:3000/dashboard`

## 📊 Endpoints Principais

### Empresas (Super Admin)
```
GET    /api/companies              # Listar empresas
POST   /api/companies              # Criar empresa
GET    /api/companies/:id          # Buscar empresa
PUT    /api/companies/:id          # Atualizar empresa
DELETE /api/companies/:id          # Deletar empresa
```

### Limites
```
GET  /api/companies/:id/limits     # Ver limites
POST /api/companies/:id/limits     # Verificar limite
PUT  /api/companies/:id/limits     # Atualizar limites (Super Admin)
```

### Usuários da Empresa
```
GET  /api/companies/:id/users      # Listar usuários
POST /api/companies/:id/users      # Criar usuário
```

### Estatísticas
```
GET /api/super-admin/dashboard     # Dashboard Super Admin
GET /api/companies/:id/stats       # Estatísticas da empresa
```

## 🔑 Exemplo de Uso - Frontend

```typescript
import { useState, useEffect } from 'react';

function CompaniesManager() {
  const [companies, setCompanies] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('/api/companies', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => setCompanies(data.companies));
  }, []);

  const createCompany = async (companyData) => {
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(companyData)
    });
    
    if (response.ok) {
      const newCompany = await response.json();
      setCompanies([...companies, newCompany]);
    }
  };

  return (
    <div>
      {/* Seu componente aqui */}
    </div>
  );
}
```

## 🔒 Verificar Permissões

```typescript
// No backend
import { hasPermission, canCreateResource } from '@/types/company';

// Verificar permissão
if (!hasPermission(user, 'users.create')) {
  return res.status(403).json({ error: 'Sem permissão' });
}

// Verificar limite de recursos
const check = canCreateResource(company, stats, 'agents');
if (!check.can) {
  return res.status(403).json({ error: check.reason });
}
```

## 📈 Monitorar Uso

```sql
-- Ver estatísticas de todas as empresas
SELECT * FROM impaai.company_stats;

-- Empresas próximas do limite (>80%)
SELECT * FROM impaai.company_stats
WHERE users_usage_percent >= 80
   OR agents_usage_percent >= 80;

-- Atividades recentes
SELECT * FROM impaai.company_activity_logs
ORDER BY created_at DESC
LIMIT 50;

-- Atualizar contadores manualmente
SELECT impaai.update_company_resource_usage('company-id');
```

## 🎯 Casos de Uso Comuns

### Cenário 1: Criar Nova Empresa para Cliente

1. Super Admin cria empresa via API ou painel
2. Define limites adequados ao plano contratado
3. Cria usuário admin da empresa
4. Admin da empresa começa a usar o sistema

### Cenário 2: Cliente Atingiu Limite

1. Sistema bloqueia criação de novo recurso
2. Admin da empresa vê alerta no dashboard
3. Admin contata suporte
4. Super Admin aumenta limite da empresa
5. Admin pode criar recursos novamente

### Cenário 3: Suspender Empresa

1. Super Admin acessa painel
2. Localiza empresa
3. Altera status para "suspended"
4. Usuários da empresa não conseguem mais fazer login
5. Recursos são mantidos no banco

## 🛠️ Troubleshooting

### Erro: "Limite atingido"
```sql
-- Verificar limites atuais
SELECT * FROM impaai.company_stats WHERE company_id = 'ID';

-- Aumentar limite (Super Admin)
UPDATE impaai.companies
SET max_users = 20, max_agents = 50
WHERE id = 'ID';
```

### Erro: "Acesso negado"
```sql
-- Verificar role do usuário
SELECT id, email, role, company_id FROM impaai.user_profiles
WHERE email = 'email@exemplo.com';

-- Alterar role
UPDATE impaai.user_profiles
SET role = 'admin'
WHERE email = 'email@exemplo.com';
```

### Logs não aparecem
```sql
-- Verificar se função existe
SELECT * FROM pg_proc WHERE proname = 'log_activity';

-- Ver logs recentes
SELECT * FROM impaai.company_activity_logs
ORDER BY created_at DESC
LIMIT 20;
```

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `docs/SISTEMA_HIERARQUICO_README.md` - Documentação completa
- `types/company.ts` - Tipos TypeScript
- `database/migrations/001_add_companies_and_hierarchy.sql` - Estrutura do banco

## 💡 Dicas

1. **Sempre verifique limites antes de criar recursos**
2. **Use os logs para auditoria**
3. **Monitore empresas próximas do limite**
4. **Faça backup regular do banco de dados**
5. **Configure alertas para recursos críticos**

## 🆘 Precisa de Ajuda?

- Verifique a documentação completa
- Consulte os logs do sistema
- Execute queries de diagnóstico
- Contate o suporte técnico
