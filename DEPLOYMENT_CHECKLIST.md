# ✅ CHECKLIST DE DEPLOYMENT - Cron de Reminders

Use este checklist para garantir que tudo está configurado corretamente antes de fazer deploy em produção.

---

## 📋 PRÉ-DEPLOYMENT

### Verificações Locais

- [ ] Git branches atualizado: `git pull origin correcao-bugs`
- [ ] Node.js v18+ instalado: `node --version`
- [ ] npm atualizado: `npm --version`
- [ ] Docker instalado: `docker --version`
- [ ] Docker Compose atualizado: `docker compose version`

### Arquivos Modificados

- [ ] `package.json` - Tem novo script `start:with-worker`?
  ```bash
  grep "start:with-worker" package.json
  ```

- [ ] `Dockerfile` - Tem as mudanças do start.sh?
  ```bash
  grep -A 2 "npx tsx scripts/reminder-cron-worker.ts" Dockerfile
  ```

- [ ] `docker-compose-production.yml` - Criado?
  ```bash
  ls -la docker-compose-production.yml
  ```

### Testes Locais

- [ ] Build funciona sem erros: `npm run build`
- [ ] Dev funciona com worker: `npm run dev`
  - Aguarde aparecer: `[reminder-cron] Worker iniciado`
- [ ] Tests passam: `npm test`
- [ ] Lint sem erros: `npm run lint`

---

## 🐳 BUILD DOCKER

### Passo 1: Build Local (Opcional)

```bash
# Construir imagem localmente
docker build -t impa365/impa-ai:correcao-bugs .

# Verificar se foi criada
docker images | grep impa365/impa-ai
```

- [ ] Build concluído sem erros
- [ ] Imagem criada com sucesso
- [ ] Tamanho razoável (< 500MB)

### Passo 2: Testar Container Local

```bash
# Rodar container localmente (OPCIONAL)
docker run -it \
  -e SUPABASE_URL=https://seu-teste.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=sua-chave \
  -e NEXTAUTH_SECRET=seu-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e REMINDER_CRON_SECRET=teste \
  -p 3000:3000 \
  impa365/impa-ai:correcao-bugs
```

- [ ] Container iniciou sem erros
- [ ] Próximas 10 linhas dos logs têm `[reminder-cron]`?

### Passo 3: Push para Registry

```bash
# Fazer login no Docker Hub (se não estiver logado)
docker login

# Fazer push
docker push impa365/impa-ai:correcao-bugs

# Verificar se foi para o registry
docker pull impa365/impa-ai:correcao-bugs
```

- [ ] Push concluído com sucesso
- [ ] Imagem disponível no Docker Hub

---

## 🔧 CONFIGURAÇÃO DE AMBIENTE

### Variáveis Obrigatórias

Verificar se todas estão definidas no seu Docker Compose/Swarm:

- [ ] `SUPABASE_URL` - URL do Supabase
  ```bash
  echo $SUPABASE_URL
  # Esperado: https://algo.supabase.co
  ```

- [ ] `SUPABASE_ANON_KEY` - Chave anônima
  ```bash
  echo $SUPABASE_ANON_KEY | head -c 20
  # Esperado: eyJhbGciOiJ...
  ```

- [ ] `SUPABASE_SERVICE_ROLE_KEY` - ⚠️ CRÍTICO!
  ```bash
  echo $SUPABASE_SERVICE_ROLE_KEY | head -c 20
  # Esperado: eyJhbGciOiJ... (diferente da anon)
  ```

- [ ] `NEXTAUTH_URL` - URL pública da app
  ```bash
  echo $NEXTAUTH_URL
  # Esperado: https://agentes.blackatende.com
  ```

- [ ] `NEXTAUTH_SECRET` - Segredo do NextAuth
  ```bash
  echo $NEXTAUTH_SECRET | wc -c
  # Esperado: > 30 caracteres
  ```

- [ ] `REMINDER_CRON_SECRET` - Segredo do cron
  ```bash
  echo $REMINDER_CRON_SECRET | wc -c
  # Esperado: > 20 caracteres
  ```

- [ ] `NODE_ENV` - Deve ser "production"
  ```bash
  echo $NODE_ENV
  # Esperado: production
  ```

### Variáveis Recomendadas (com Defaults)

- [ ] `REMINDER_CRON_SCHEDULE` - Agenda do cron
  ```yaml
  # Padrão se não definido: "* * * * *" (cada minuto - MUDE ISSO!)
  # Recomendado: "0 * * * *" (cada hora)
  # Configurar em docker-compose.yml
  ```

- [ ] `REMINDER_CRON_TIMEZONE` - Timezone
  ```yaml
  # Padrão: America/Sao_Paulo (OK para seu caso)
  ```

- [ ] `REMINDER_CRON_DRY_RUN` - Modo teste
  ```yaml
  # Padrão: "0" (desativado, executa de verdade)
  # Para testar, use: "1" (ativado, não faz nada)
  ```

- [ ] `REMINDER_CRON_RUN_ON_START` - Executar ao iniciar
  ```yaml
  # Padrão: "1" (executa ao iniciar - BOM!)
  # Para desativar: "0"
  ```

### Checklist de Variáveis

```bash
# Executar este script para verificar tudo
cat > /tmp/check-env.sh << 'EOF'
#!/bin/bash
echo "Verificando variáveis obrigatórias..."

check_var() {
    local var=$1
    if [ -z "${!var}" ]; then
        echo "❌ $var = NÃO DEFINIDA"
        return 1
    else
        echo "✅ $var = ${!var:0:30}..."
        return 0
    fi
}

check_var SUPABASE_URL
check_var SUPABASE_SERVICE_ROLE_KEY
check_var NEXTAUTH_URL
check_var NEXTAUTH_SECRET
check_var REMINDER_CRON_SECRET
check_var NODE_ENV
EOF

bash /tmp/check-env.sh
```

- [ ] Todas as variáveis obrigatórias aparecem como ✅

---

## 🚀 DEPLOYMENT

### Opção A: Docker Swarm

```bash
# Fazer deploy do stack
docker stack deploy -c docker-compose-production.yml impa-ai

# Aguardar rollout (pode levar 2-3 minutos)
sleep 10

# Verificar status
docker service ls | grep impa-ai
```

- [ ] Stack deployado sem erros
- [ ] Service mostra status "replicated"
- [ ] Replicas em estado "1/1" ou "Ready"

### Opção B: Portainer UI

1. [ ] Acessar Portainer em sua VPS
2. [ ] Ir para "Stacks"
3. [ ] Procurar stack "impa-ai"
4. [ ] Clicar em "Edit"
5. [ ] Colar conteúdo do `docker-compose-production.yml`
6. [ ] Clicar "Update the stack"
7. [ ] Aguardar deployment

---

## 📊 VERIFICAÇÕES PÓS-DEPLOYMENT

### Imediatamente Após Deploy

```bash
# Ver logs (últimos 50 linhas)
docker service logs impa-ai | tail -50

# Procurar por "[reminder-cron]"
docker service logs impa-ai | grep "reminder-cron"
```

- [ ] Logs aparecem sem erros
- [ ] Aparecem linhas com `[reminder-cron]`
- [ ] Esperado: `Worker iniciado` e `Executando cron`

### Depois de 5 Minutos

```bash
# Verificar se container está estável
docker service ls | grep impa-ai

# Ver últimos logs
docker service logs impa-ai --tail 20 | grep -E "reminder|error|ERROR"
```

- [ ] Container continua rodando (não restartou)
- [ ] Sem mensagens de erro nos logs

### Depois de 15 Minutos

```bash
# Verificar se cron executou mais de uma vez
docker service logs impa-ai | grep "Execução concluída" | wc -l

# Esperado: pelo menos 2-3 execuções (dependendo da agenda)
```

- [ ] Cron executou múltiplas vezes
- [ ] Cada execução registrou sucesso ou erro

---

## 🌐 TESTES DE API

### Health Check

```bash
# Testar se API está respondendo
curl -s https://agentes.blackatende.com/api/system/version | head -20
```

- [ ] API respondendo com HTTP 200

### Status do Cron

```bash
# Ver status do cron
curl -s https://agentes.blackatende.com/api/admin/reminders/cron | jq '.schedule, .timezone, .lastRuns[0]'
```

Esperado:
```json
{
  "schedule": "0 * * * *",
  "timezone": "America/Sao_Paulo",
  "lastRuns": [
    {
      "success": true,
      "remindersDue": 5,
      "remindersSent": 3,
      ...
    }
  ]
}
```

- [ ] API retorna JSON válido
- [ ] `success` é `true`
- [ ] Há pelo menos um run no histórico

### Trigger Manual (DRY-RUN)

```bash
# Testar disparar cron manualmente (modo teste)
curl -X POST https://agentes.blackatende.com/api/internal/reminders/run \
  -H "x-reminder-cron-secret: 65dsf5s95ff6s52f5s9sWASWED98" \
  -H "x-dry-run: 1" \
  -H "Content-Type: application/json" | jq '.'
```

Esperado:
```json
{
  "success": true,
  "summary": {
    "totalTriggers": 5,
    "remindersDue": 2,
    "sent": 0,
    "failed": 0,
    ...
  }
}
```

- [ ] API retorna sucesso
- [ ] `summary` contém estatísticas válidas
- [ ] `sent` = 0 (porque é dry-run)

### Teste Real (CUIDADO!)

```bash
# ⚠️ USAR COM CUIDADO - ISSO ENVIA MENSAGENS DE VERDADE!
# Só fazer isto se tiver lembretes pendentes para testar

curl -X POST https://agentes.blackatende.com/api/internal/reminders/run \
  -H "x-reminder-cron-secret: 65dsf5s95ff6s52f5s9sWASWED98" \
  -H "Content-Type: application/json" | jq '.'
```

- [ ] ⚠️ Apenas se tiver triggers de teste configurados
- [ ] Verificar se lembretes foram enviados no WhatsApp
- [ ] Verificar logs do banco em `reminder_trigger_logs`

---

## 🖥️ DASHBOARD UI

### Acessar Interface

```
https://agentes.blackatende.com/admin/settings/cron
```

- [ ] Dashboard carrega sem erros
- [ ] Mostra "Agendamento: 0 * * * *"
- [ ] Mostra "Timezone: America/Sao_Paulo"
- [ ] Mostra próximas 5 execuções
- [ ] Mostra últimas 5 execuções com status

### Visualizar Dados

- [ ] Botão "Atualizar" funciona
- [ ] Próximas execuções estão corretas (próximas horas)
- [ ] Últimas execuções têm timestamps válidos
- [ ] Status são "Sucesso", "Falha" ou "Em execução"

---

## 🗄️ VERIFICAÇÕES DE BANCO DE DADOS

### Via Supabase Console

Execute estas queries:

#### 1. Verificar Triggers Ativos

```sql
SELECT COUNT(*) as total_triggers
FROM impaai.reminder_triggers
WHERE is_active = true;
```

- [ ] Resultado > 0 (tem triggers ativos)

#### 2. Ver Últimos Runs do Cron

```sql
SELECT 
  id,
  started_at,
  finished_at,
  duration_ms,
  success,
  reminders_due,
  reminders_sent,
  reminders_failed
FROM impaai.reminder_cron_runs
ORDER BY started_at DESC
LIMIT 5;
```

- [ ] Há pelo menos 2-3 runs
- [ ] `success` é mostly `true`
- [ ] `duration_ms` é entre 500ms e 10000ms

#### 3. Ver Logs de Disparo

```sql
SELECT 
  trigger_id,
  booking_uid,
  executed_at,
  success,
  error_message
FROM impaai.reminder_trigger_logs
ORDER BY executed_at DESC
LIMIT 10;
```

- [ ] Há logs de execução
- [ ] Alguns têm `success = true`

---

## 🔍 TROUBLESHOOTING

Se algo não funcionar, seguir este fluxo:

### 1. Container Rodando?

```bash
docker service ls | grep impa-ai
```

- [ ] Se não aparecer, fazer: `docker stack deploy -c docker-compose-production.yml impa-ai`

### 2. Logs Têm Erros?

```bash
docker service logs impa-ai 2>&1 | grep -i error | head -5
```

- [ ] Se houver erros, anotar e verificar em `CRON_DEPLOYMENT_GUIDE.md`

### 3. Variáveis Definidas?

```bash
docker service inspect impa-ai | grep -A 100 "Env" | grep SUPABASE
```

- [ ] Se não mostrar `SUPABASE_SERVICE_ROLE_KEY`, adicionar em docker-compose

### 4. Worker Iniciou?

```bash
docker service logs impa-ai | grep "Worker iniciado"
```

- [ ] Se não aparecer, verificar logs completos e restart

### 5. Executar Script de Verificação

```bash
bash scripts/verify-cron-deployment.sh https://agentes.blackatende.com
```

- [ ] Corrigir qualquer verificação que falhar

---

## ✅ SIGN-OFF

- [ ] Todas as verificações passou
- [ ] API respondendo
- [ ] Cron executando
- [ ] Dashboard mostrando dados
- [ ] Banco registrando execuções

### Pronto para Produção!

```
Data de Deploy: ___/___/______
Realizado por: ________________
Assinatura: ___________________
```

---

## 📞 Contato de Suporte

Se precisar de ajuda:

1. Verificar: `docs/CRON_DEPLOYMENT_GUIDE.md`
2. Verificar logs: `docker service logs impa-ai`
3. Executar script: `bash scripts/verify-cron-deployment.sh`
4. Revisar: `CRON_FIX_DIAGRAM.md`

---

**Última atualização**: 11 de novembro de 2025
