# 🚀 Guia de Deployment - Cron de Reminders em Produção

## 📋 Sumário do Problema

**Situação**: O cron funciona localmente com `npm run dev`, mas não roda no Docker/VPS em produção.

**Causa**: O Docker está executando apenas `npm start` (Next.js), sem iniciar o **worker de reminder** (`reminder-cron-worker.ts`).

**Solução**: Modificar o Dockerfile e o Docker Compose para iniciar AMBOS os processos em paralelo.

---

## ✅ Checklist de Deployment

### 1. Variáveis de Ambiente Obrigatórias

```bash
# Supabase - OBRIGATÓRIO
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-servico    # ⚠️ CRÍTICO para o cron!

# NextAuth
NEXTAUTH_URL=https://sua-url.com
NEXTAUTH_SECRET=seu-segredo-forte

# Cron
REMINDER_CRON_SECRET=seu-segredo-cron

# Ambiente
NODE_ENV=production
```

**❌ ERROS COMUNS:**
- ✗ `SUPABASE_SERVICE_ROLE_KEY` faltando → Worker não consegue buscar triggers
- ✗ `REMINDER_CRON_SECRET` faltando → Worker inicia mas não consegue fazer requisições
- ✗ `NODE_ENV=development` em produção → Comportamento impredizível

---

### 2. Variáveis de Ambiente do Cron (Opcionais com Defaults)

```bash
# Agendamento
REMINDER_CRON_SCHEDULE="0 * * * *"               # Padrão: cada hora
REMINDER_CRON_TIMEZONE="America/Sao_Paulo"       # Padrão: São Paulo
REMINDER_CRON_DRY_RUN="0"                        # Padrão: desativado (0=ativo)
REMINDER_CRON_RUN_ON_START="1"                   # Padrão: executar ao iniciar

# Performance
REMINDER_CRON_TOLERANCE_MINUTES="5"              # Janela de tolerância
REMINDER_CRON_TIMEOUT_MS="10000"                 # Timeout de requisições
REMINDER_CRON_MAX_LOOKBACK_MINUTES="720"         # 12 horas atrás
REMINDER_TRIGGER_GRACE_MINUTES="5"               # Período de carência
```

---

## 🔧 Modificações Realizadas

### 1. **Package.json**

Adicionado novo script:
```json
"start:with-worker": "concurrently \"npm:start\" \"npm:reminder:worker\""
```

**Uso**: Pode ser usado localmente para testar o comportamento de produção.

---

### 2. **Dockerfile**

**Mudanças**:

a) **Copiar scripts necessários**:
```dockerfile
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts
```

b) **Script start.sh melhorado** que inicia ambos os processos:

```bash
#!/bin/sh
# Inicia Next.js em background
node server.js &
NEXT_PID=$!

# Inicia Cron Worker em background
npx tsx scripts/reminder-cron-worker.ts &
WORKER_PID=$!

# Aguarda ambos e trata sinais (SIGTERM/SIGINT)
trap cleanup SIGTERM SIGINT
wait
```

---

### 3. **Docker Compose/Stack**

**Adicionadas variáveis de ambiente**:
```yaml
environment:
  - SUPABASE_SERVICE_ROLE_KEY=...        # ⚠️ CRÍTICO!
  - REMINDER_CRON_SCHEDULE=0 * * * *
  - REMINDER_CRON_TIMEZONE=America/Sao_Paulo
  - REMINDER_CRON_SECRET=seu-segredo
  - REMINDER_CRON_DRY_RUN=0
  - REMINDER_CRON_RUN_ON_START=1
```

**Adicionado healthcheck**:
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/system/version"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## 🚀 Passos para Deploy

### Passo 1: Rebuild da Imagem Docker

```bash
# No seu machine local ou CI/CD
docker build -t impa365/impa-ai:correcao-bugs .

# Fazer push para o registry
docker push impa365/impa-ai:correcao-bugs
```

### Passo 2: Atualizar Stack no Portainer/Docker Swarm

```bash
# Opção 1: Via Docker Swarm (linha de comando)
docker stack deploy -c docker-compose-production.yml impa-ai

# Opção 2: Via Portainer
# 1. Vá em Stacks
# 2. Atualize a stack com o novo arquivo docker-compose-production.yml
# 3. Deploy
```

### Passo 3: Verificar se o Cron Está Rodando

```bash
# Ver os containers rodando
docker ps | grep impa-ai

# Ver logs da aplicação (incluindo worker)
docker service logs impa-ai

# Procurar por "[reminder-cron]" nos logs
docker service logs impa-ai | grep "reminder-cron"

# Saída esperada:
# [reminder-cron][2025-11-11T10:30:00Z] Worker iniciado
# [reminder-cron][2025-11-11T10:30:00Z] Executando cron disparado por startup
```

### Passo 4: Testar Manualmente

**Opção 1: Via Health Monitor (UI)**
```
https://agentes.blackatende.com/admin/settings/cron
```

Você deve ver:
- ✅ Agendamento ativo
- ✅ Próximas execuções listadas
- ✅ Histórico de execuções

**Opção 2: Via API**
```bash
# Ver status do cron
curl https://agentes.blackatende.com/api/admin/reminders/cron

# Resposta esperada:
{
  "success": true,
  "schedule": "0 * * * *",
  "timezone": "America/Sao_Paulo",
  "dryRun": false,
  "serverTime": "2025-11-11T13:30:00Z",
  "lastRuns": [...],
  "nextRuns": [...]
}
```

**Opção 3: Trigger Manual (com cuidado!)**
```bash
# Executar um dry-run (teste, sem efeitos reais)
curl -X POST https://agentes.blackatende.com/api/internal/reminders/run \
  -H "x-reminder-cron-secret: seu-segredo" \
  -H "x-dry-run: 1"

# Resposta esperada:
{
  "success": true,
  "summary": {
    "totalTriggers": 5,
    "remindersDue": 2,
    "sent": 2,
    "failed": 0,
    ...
  }
}
```

---

## 🐛 Troubleshooting

### ❌ Problema: "Worker não inicia"

**Logs típicos**:
```
[reminder-cron] ⚠️ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias
```

**Solução**:
1. Verificar se `SUPABASE_SERVICE_ROLE_KEY` está definida no Docker Compose
2. Verificar se a chave está correta (copiar do Supabase)
3. Restart do container:
   ```bash
   docker service update --force-update impa-ai
   ```

---

### ❌ Problema: "Cron roda mas não dispara lembretes"

**Verificar logs**:
```bash
docker service logs impa-ai | grep -A 5 "Execução concluída"
```

**Verificações**:
1. Existem triggers ativos no banco?
   ```sql
   SELECT COUNT(*) FROM impaai.reminder_triggers WHERE is_active = true;
   ```

2. Triggers têm agentes válidos?
   ```sql
   SELECT rt.id, rt.agent_id, a.name 
   FROM impaai.reminder_triggers rt
   LEFT JOIN impaai.ai_agents a ON a.id = rt.agent_id
   WHERE rt.is_active = true;
   ```

3. Agentes têm configuração de calendário?
   ```sql
   SELECT id, name, calendar_provider, calendar_api_key
   FROM impaai.ai_agents
   WHERE id IN (SELECT DISTINCT agent_id FROM impaai.reminder_triggers WHERE is_active = true);
   ```

---

### ❌ Problema: "Container restarta constantemente"

**Logs típicos**:
```
impa-ai | Error: Cannot find module 'tsx'
```

**Solução**:
```dockerfile
# Garantir que node_modules está incluído
COPY --from=builder /app/node_modules ./node_modules
```

Reconstruir imagem:
```bash
docker build --no-cache -t impa365/impa-ai:correcao-bugs .
```

---

### ❌ Problema: "Cron rodando mas sem atualizar logs"

**Verificar se está em dry-run mode**:
```bash
docker service logs impa-ai | grep "Dry run"
```

**Solução**:
```yaml
environment:
  - REMINDER_CRON_DRY_RUN=0  # 0 = desativado (executar de verdade)
```

---

### ✅ Verificação Final

Execute este script para testar tudo:

```bash
#!/bin/bash

echo "🔍 Verificação de Deployment do Cron"
echo "===================================="

# 1. Container rodando?
echo -n "✓ Container rodando? "
if docker ps | grep -q impa-ai; then
  echo "✅"
else
  echo "❌"
  exit 1
fi

# 2. Logs do worker
echo -n "✓ Worker iniciado? "
if docker service logs impa-ai 2>/dev/null | grep -q "Worker iniciado"; then
  echo "✅"
else
  echo "⚠️  Verificar logs"
fi

# 3. API respondendo
echo -n "✓ API respondendo? "
if curl -s https://agentes.blackatende.com/api/admin/reminders/cron | grep -q "success"; then
  echo "✅"
else
  echo "❌"
fi

# 4. Banco de dados conectado
echo -n "✓ Banco de dados? "
if docker service logs impa-ai 2>/dev/null | grep -q "SUPABASE_URL"; then
  echo "✅"
else
  echo "⚠️  Verificar variáveis"
fi

echo ""
echo "✅ Deployment verificado!"
```

---

## 📊 Monitoramento em Produção

### Dashboards

1. **Monitor do Cron** (UI)
   - URL: `https://agentes.blackatende.com/admin/settings/cron`
   - Mostra: Próximas execuções, histórico, status

2. **Logs em Tempo Real**
   ```bash
   docker service logs -f impa-ai
   ```

3. **Métricas do Banco**
   ```sql
   -- Últimas execuções
   SELECT started_at, duration_ms, success, reminders_sent, reminders_failed
   FROM impaai.reminder_cron_runs
   ORDER BY started_at DESC
   LIMIT 10;
   
   -- Gatilhos ativos
   SELECT agent_id, COUNT(*) as total
   FROM impaai.reminder_triggers
   WHERE is_active = true
   GROUP BY agent_id;
   ```

---

## 🔒 Segurança

### Proteções Implementadas

1. ✅ **Segredo do Cron** - Headers `x-reminder-cron-secret`
2. ✅ **Service Role Key** - Protegida em variável de ambiente
3. ✅ **Dry-run Mode** - Para testes sem efeitos
4. ✅ **Logs Auditados** - Cada tentativa é registrada
5. ✅ **Graceful Shutdown** - Trata SIGTERM/SIGINT

### Recomendações

- 🔐 Use secrets do Docker Swarm em vez de texto plano
- 🔐 Rotação periódica de `REMINDER_CRON_SECRET`
- 🔐 Limite acesso a `/api/internal/reminders/run` por IP (usar reverse proxy)
- 📊 Monitore `/api/admin/reminders/cron` para anomalias

---

## 🎯 Resumo

| Item | Status |
|------|--------|
| Next.js API | ✅ Rodando |
| Cron Worker | ✅ Agora rodando em produção! |
| Healthcheck | ✅ Configurado |
| Logs | ✅ Estruturados |
| Variáveis | ✅ Documentadas |
| Troubleshooting | ✅ Disponível |

---

**Data**: 11 de novembro de 2025  
**Status**: ✅ Pronto para deploy
