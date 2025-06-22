# 🔥 CHECKLIST DE CORREÇÕES DE SEGURANÇA - IMPA AI

**Status Geral**: 🔴 CRÍTICO  
**Data de Criação**: 21/12/2024  
**Última Atualização**: 21/12/2024

---

## 🚨 VULNERABILIDADES CRÍTICAS (PRIORIDADE MÁXIMA)

### ⚡ Ação Imediata Requerida

- [ ] **PARAR PRODUÇÃO** - Retirar aplicação do ar imediatamente
- [ ] **RESETAR SENHAS** - Todas as senhas existentes devem ser redefinidas
- [ ] **REGENERAR API KEYS** - Todas as chaves devem ser recriadas
- [ ] **AUDITORIA DE LOGS** - Verificar se houve acessos não autorizados

---

### 1. 🔐 AUTENTICAÇÃO COMPLETAMENTE QUEBRADA

- [ ] **Implementar middleware de autenticação**
  - [ ] Verificação de JWT em rotas da API (`middleware.ts` linha 22)
  - [ ] Verificação de sessão em páginas (`middleware.ts` linha 31)
  - [ ] Testar autenticação em todas as rotas protegidas
- [ ] **Configurar proteção de rotas**
  - [ ] Definir rotas públicas vs privadas
  - [ ] Implementar redirecionamento para login
  - [ ] Configurar timeout de sessão

**Arquivos para modificar**: `middleware.ts`, `lib/auth-server.ts`

---

### 2. 🔑 SENHAS EM TEXTO PLANO

- [ ] **Implementar hash de senhas**
  - [ ] Modificar `app/api/auth/login/route.ts` para usar bcrypt.compare()
  - [ ] Atualizar função de registro para hash automático
  - [ ] Corrigir scripts SQL do banco de dados
- [ ] **Migração de senhas existentes**
  - [ ] Script para fazer hash das senhas atuais
  - [ ] Backup do banco antes da migração
  - [ ] Validar que todas as senhas foram migradas
- [ ] **Atualizar validação**
  - [ ] Remover comparação direta de senhas
  - [ ] Implementar salt adequado
  - [ ] Configurar rounds de bcrypt (mínimo 12)

**Arquivos para modificar**: `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`, Scripts SQL

---

### 3. 🌐 WEBHOOK PÚBLICO SEM AUTENTICAÇÃO

- [ ] **Proteger webhook com autenticação**
  - [ ] Implementar verificação de API key ou token
  - [ ] Validar origem das requisições
  - [ ] Implementar assinatura de webhook (HMAC)
- [ ] **Validação de dados**
  - [ ] Schema validation para payloads
  - [ ] Sanitização de dados de entrada
  - [ ] Limite de tamanho de payload
- [ ] **Rate limiting específico**
  - [ ] Limite de requests por IP
  - [ ] Throttling por webhook

**Arquivos para modificar**: `app/api/agents/webhook/route.ts`

---

### 4. 🔐 EXPOSIÇÃO DE CHAVES SECRETAS

- [ ] **Corrigir configuração de environment variables**
  - [ ] Remover `` de chaves sensíveis
  - [ ] Usar apenas variáveis server-side para dados privados
  - [ ] Implementar validação de configuração obrigatória
- [ ] **Revisar uso de SERVICE_ROLE_KEY**
  - [ ] Usar apenas em operações administrativas
  - [ ] Remover fallbacks perigosos
  - [ ] Implementar client adequado para cada contexto
- [ ] **Auditoria de variáveis**
  - [ ] Mapear todas as variáveis de ambiente
  - [ ] Verificar exposure no client-side
  - [ ] Documentar uso correto

**Arquivos para modificar**: Múltiplos em `app/api/`, `lib/config.ts`, `lib/supabase-config.ts`

---

## 🟠 VULNERABILIDADES ALTAS (PRIORIDADE ALTA)

### 5. 🗄️ PERMISSÕES EXCESSIVAS NO BANCO

- [ ] **Configurar Row Level Security (RLS)**
  - [ ] Habilitar RLS em todas as tabelas
  - [ ] Criar políticas específicas por tipo de usuário
  - [ ] Remover permissões globais para usuários anônimos
- [ ] **Revisar scripts SQL**
  - [ ] Modificar `database/database-ofc/2 supabase-setup-2-etapa-correcoes.sql`
  - [ ] Implementar políticas granulares
  - [ ] Testar acesso com diferentes níveis de usuário

**Arquivos para modificar**: Scripts SQL em `database/`

---

### 6. ✅ VALIDAÇÃO DE ENTRADA AUSENTE

- [ ] **Implementar validação com Zod**
  - [ ] Criar schemas para todas as rotas API
  - [ ] Validar payloads JSON antes do processamento
  - [ ] Implementar middleware de validação
- [ ] **Tratamento de erros robusto**
  - [ ] Try/catch em todos os `request.json()`
  - [ ] Validação de tamanho de payload
  - [ ] Sanitização de dados de entrada
- [ ] **Substituir JSON.parse() inseguro**
  - [ ] Usar parsing seguro em `evolutionBot/delete` e `update`
  - [ ] Validar estrutura antes de fazer parse
  - [ ] Implementar fallbacks seguros

**Arquivos para modificar**: Todas as rotas em `app/api/`

---

### 7. 🕵️ VAZAMENTO DE INFORMAÇÕES SENSÍVEIS

- [ ] **Configurar logging produção**
  - [ ] Remover logs de emails e IDs de usuários
  - [ ] Implementar níveis de log (dev vs prod)
  - [ ] Usar placeholders para dados sensíveis
- [ ] **Revisar console.log em produção**
  - [ ] Substituir por logger adequado
  - [ ] Configurar logs estruturados
  - [ ] Implementar rotação de logs

**Arquivos para modificar**: Múltiplos em `app/api/`

---

## 🟡 VULNERABILIDADES MÉDIAS (PRIORIDADE MÉDIA)

### 8. 🛡️ HEADERS DE SEGURANÇA AUSENTES

- [ ] **Implementar headers de segurança**
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Content-Security-Policy`
  - [ ] `Strict-Transport-Security`
- [ ] **Configurar CORS adequadamente**
  - [ ] Definir origins permitidas
  - [ ] Configurar métodos e headers
  - [ ] Implementar preflight handling
- [ ] **Usar middleware de segurança**
  - [ ] Implementar em `middleware.ts`
  - [ ] Testar em diferentes browsers
  - [ ] Validar com ferramentas de segurança

**Arquivos para modificar**: `middleware.ts`, `next.config.mjs`

---

### 9. 🚦 RATE LIMITING NÃO IMPLEMENTADO

- [ ] **Implementar rate limiting**
  - [ ] Usar biblioteca adequada (ex: `@upstash/ratelimit`)
  - [ ] Configurar limites por endpoint
  - [ ] Implementar diferentes níveis por usuário
- [ ] **Configurar throttling**
  - [ ] Rate limiting por IP
  - [ ] Rate limiting por usuário autenticado
  - [ ] Rate limiting por API key
- [ ] **Implementar proteção contra brute force**
  - [ ] Limites especiais para login
  - [ ] Bloqueio temporário após tentativas
  - [ ] Logs de tentativas de abuso

**Arquivos para modificar**: `middleware.ts`, rotas de autenticação

---

## 📝 CHECKLIST DE VALIDAÇÃO

### Testes de Segurança Obrigatórios

- [ ] **Teste de autenticação**
  - [ ] Tentar acessar rotas protegidas sem autenticação
  - [ ] Validar expiração de tokens
  - [ ] Testar diferentes níveis de usuário
- [ ] **Teste de autorização**
  - [ ] Usuário comum não pode acessar dados de admin
  - [ ] Usuário não pode acessar dados de outros usuários
  - [ ] Validar permissões granulares
- [ ] **Teste de validação**
  - [ ] Enviar payloads malformados
  - [ ] Testar tamanhos de payload excessivos
  - [ ] Validar sanitização de dados
- [ ] **Teste de configuração**
  - [ ] Verificar que chaves sensíveis não estão expostas
  - [ ] Validar headers de segurança
  - [ ] Testar rate limiting

### Documentação Obrigatória

- [ ] **Documentar arquitetura de segurança**
- [ ] **Criar guia de configuração segura**
- [ ] **Documentar processo de autenticação**
- [ ] **Criar procedimentos de incident response**

---

## 🎯 STATUS POR CATEGORIA

| Categoria    | Total | Concluído | Pendente | Status |
| ------------ | ----- | --------- | -------- | ------ |
| **Críticas** | 4     | 0         | 4        | 🔴     |
| **Altas**    | 3     | 0         | 3        | 🟠     |
| **Médias**   | 2     | 0         | 2        | 🟡     |
| **TOTAL**    | **9** | **0**     | **9**    | **🔴** |

---

## 📅 CRONOGRAMA SUGERIDO

### Semana 1 (URGENTE)

- [ ] Parar produção
- [ ] Implementar autenticação básica
- [ ] Corrigir senhas em texto plano
- [ ] Proteger webhook crítico

### Semana 2

- [ ] Corrigir exposição de chaves
- [ ] Implementar validação de entrada
- [ ] Configurar permissões do banco

### Semana 3

- [ ] Headers de segurança
- [ ] Rate limiting
- [ ] Logging seguro

### Semana 4

- [ ] Testes de segurança completos
- [ ] Auditoria final
- [ ] Documentação

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

Para que a aplicação seja considerada **SEGURA PARA PRODUÇÃO**:

- [ ] ✅ Todas as vulnerabilidades **CRÍTICAS** corrigidas
- [ ] ✅ Todas as vulnerabilidades **ALTAS** corrigidas
- [ ] ✅ Pelo menos 80% das vulnerabilidades **MÉDIAS** corrigidas
- [ ] ✅ Testes de segurança passando 100%
- [ ] ✅ Auditoria externa aprovada
- [ ] ✅ Documentação de segurança completa

---

_Atualizar este checklist conforme as correções forem implementadas_  
_Data da última atualização: 21/12/2024_
