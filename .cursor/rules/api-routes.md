---
description:
globs:
alwaysApply: false
---
# Rotas da API e Endpoints

## Estrutura da API
A API segue a estrutura do Next.js App Router em [app/api/](mdc:app/api/).

## Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de novo usuário
- `POST /api/auth/logout` - Logout

### Administração
- `GET /api/admin/users` - Listar usuários
- `POST /api/admin/users` - Criar usuário
- `GET /api/admin/agents` - Listar agentes (admin)
- `GET /api/admin/dashboard` - Estatísticas admin

### Agentes
- `GET /api/user/agents` - Listar agentes do usuário
- `POST /api/user/agents` - Criar novo agente
- `PUT /api/user/agents/[id]` - Atualizar agente
- `DELETE /api/user/agents/[id]` - Deletar agente
- `GET /api/agents/stats` - Estatísticas de agentes
- `POST /api/agents/webhook` - Webhook para receber mensagens

### WhatsApp
- `GET /api/whatsapp/status/[instanceName]` - Status da instância
- `GET /api/whatsapp/qr/[instanceName]` - QR Code para conexão
- `POST /api/whatsapp/create-instance` - Criar nova instância
- `DELETE /api/whatsapp/disconnect/[instanceName]` - Desconectar instância

### Integrações
- `GET /api/integrations/evolution/config` - Configuração Evolution API
- `POST /api/integrations/evolution/settings/[instanceName]` - Configurar instância

## Padrões de Resposta
```typescript
// Sucesso
{
  success: true,
  data: any,
  message?: string
}

// Erro
{
  success: false,
  error: string,
  details?: any
}
```

## Middleware
- [middleware.ts](mdc:middleware.ts): Proteção de rotas
- Validação de JWT em rotas protegidas
- Rate limiting (planejado)
- CORS configurado

## Clients e Utilities
- [lib/api-client.ts](mdc:lib/api-client.ts): Cliente HTTP
- [lib/evolution-api.ts](mdc:lib/evolution-api.ts): Client Evolution API
- [lib/supabase.ts](mdc:lib/supabase.ts): Client Supabase
