# 🔍 COMO CONFERIR SE O CRON ESTÁ RODANDO

## 5 Maneiras para Verificar

---

## 1️⃣ VER LOGS (MAIS FÁCIL) ✅

```bash
docker service logs impa-ai | grep "reminder-cron"
```

**Esperado:**
```
[reminder-cron][2025-11-11T10:00:00Z] Worker iniciado
[reminder-cron][2025-11-11T10:00:00Z] Executando cron disparado por startup
[reminder-cron][2025-11-11T10:00:00Z] Execução concluída
```

### Ver últimas 50 linhas de log:
```bash
docker service logs impa-ai | tail -50
```

### Ver logs em tempo real (ao vivo):
```bash
docker service logs -f impa-ai
```

**Sair**: Press `Ctrl+C`

---

## 2️⃣ ACESSAR DASHBOARD (MAIS VISUAL) ✅

### URL
```
https://agentes.blackatende.com/admin/settings/cron
```

### O que você vai ver:
- ✅ Status: "Executando"
- ✅ Agendamento: "0 * * * *" (cada hora)
- ✅ Timezone: "America/Sao_Paulo"
- ✅ Próximas 5 execuções programadas
- ✅ Últimas 5 execuções com status e métricas

---

## 3️⃣ CHAMAR API (MAIS TÉCNICO) ✅

```bash
curl https://agentes.blackatende.com/api/admin/reminders/cron
```

**Resposta esperada:**
```json
{
  "success": true,
  "schedule": "0 * * * *",
  "timezone": "America/Sao_Paulo",
  "dryRun": false,
  "serverTime": "2025-11-11T13:30:00Z",
  "lastRuns": [
    {
      "id": "uuid",
      "startedAt": "2025-11-11T13:00:00Z",
      "finishedAt": "2025-11-11T13:00:05Z",
      "durationMs": 5200,
      "success": true,
      "remindersDue": 5,
      "remindersSent": 3,
      "remindersFailed": 0
    }
  ],
  "nextRuns": [
    "2025-11-11T14:00:00Z",
    "2025-11-11T15:00:00Z"
  ]
}
```

---

## 4️⃣ VERIFICAR CONTAINER (BÁSICO) ✅

### Container está rodando?
```bash
docker service ls | grep impa-ai
```

**Esperado:**
```
ID          NAME      MODE        REPLICAS  IMAGE
xyz         impa-ai   replicated  1/1       impa365/impa-ai:correcao-bugs
```

**Se mostrar `0/1` = problema!**

### Ver detalhes do serviço
```bash
docker service inspect impa-ai
```

---

## 5️⃣ RODAR SCRIPT DE VERIFICAÇÃO (AUTOMÁTICO) ✅

```bash
bash scripts/verify-cron-deployment.sh https://agentes.blackatende.com
```

**Vai verificar automaticamente:**
- ✅ Docker daemon ativo
- ✅ Container rodando
- ✅ Worker iniciado
- ✅ Supabase conectado
- ✅ Execução do cron
- ✅ API respondendo
- ✅ Sem erros críticos

---

## 🚦 QUICK CHECK (30 SEGUNDOS)

```bash
# Ver se está rodando
docker service ls | grep impa-ai

# Ver logs (esperado: [reminder-cron])
docker service logs impa-ai | grep -i "reminder\|cron" | tail -5

# Ver status API
curl -s https://agentes.blackatende.com/api/admin/reminders/cron | grep "success"
```

---

## ⚠️ SINAIS DE PROBLEMA

### ❌ Problema: "Container não está rodando"

```bash
# Ver status
docker service ls | grep impa-ai
# Resultado: 0/1 (deveria ser 1/1)
```

**Solução:**
```bash
# Reiniciar
docker service update --force-update impa-ai

# Aguardar 30 segundos
sleep 30

# Verificar logs de erro
docker service logs impa-ai | grep -i "error\|fatal"
```

---

### ❌ Problema: "Logs vazios / não aparecem [reminder-cron]"

```bash
# Sem logs
docker service logs impa-ai

# Solução: aumentar buffer
docker service logs --tail 200 impa-ai | grep "reminder-cron"
```

---

### ❌ Problema: "API retorna erro 500"

```bash
curl -v https://agentes.blackatende.com/api/admin/reminders/cron

# Ver resposta completa
docker service logs impa-ai | grep -i "supabase\|error" | tail -10
```

**Verificar:**
- `SUPABASE_URL` definida?
- `SUPABASE_SERVICE_ROLE_KEY` definida?

```bash
docker service inspect impa-ai | grep -i "supabase"
```

---

### ❌ Problema: "Worker iniciado mas não executa cron"

```bash
# Ver logs
docker service logs impa-ai | grep "Execução"

# Se não aparecer, verificar:
# 1. Há triggers ativos no banco?
SELECT COUNT(*) FROM impaai.reminder_triggers WHERE is_active = true;

# 2. Próximo horário de execução?
docker service logs impa-ai | grep "próximos"
```

---

## 🟢 TUDO OK? SINAIS DE SUCESSO

✅ **Logs mostram:**
```
[reminder-cron] Worker iniciado
[reminder-cron] Execução concluída
```

✅ **Dashboard mostra:**
- Status: Executando
- Últimas execuções: com timestamps
- Próximas execuções: com timestamps

✅ **API retorna:**
```json
{ "success": true, "lastRuns": [...] }
```

✅ **Container:**
```
impa-ai   replicated  1/1
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

- [ ] Container status: `docker service ls | grep impa-ai` = `1/1`?
- [ ] Logs têm `[reminder-cron]`?
- [ ] Dashboard acessível?
- [ ] API respondendo com `success: true`?
- [ ] Últimas execuções têm data/hora válida?
- [ ] Sem mensagens de erro nos logs?

Se **todas** tiverem ✅ = **Cron está rodando perfeitamente!**

---

## 🔄 VERIFICAÇÃO PERIÓDICA

### Diariamente (1 min)
```bash
# Ver últimas execuções
docker service logs impa-ai | grep "Execução concluída" | tail -3
```

### Semanalmente (5 min)
```bash
# Rodar script completo
bash scripts/verify-cron-deployment.sh https://agentes.blackatende.com
```

### Mensalmente (10 min)
```bash
# Verificar histórico no banco
# Query no Supabase:
SELECT COUNT(*) as total_runs 
FROM impaai.reminder_cron_runs 
WHERE success = true;
```

---

## 🆘 MAIS DETALHES?

Se algo não funcionar:

1. **Rodar**: `bash scripts/verify-cron-deployment.sh`
2. **Ler**: `docs/CRON_DEPLOYMENT_GUIDE.md` (seção Troubleshooting)
3. **Consultar**: `DEPLOYMENT_CHECKLIST.md`

---

## 📞 RESUMO RÁPIDO

| O que verificar | Comando |
|-----------------|---------|
| **Logs** | `docker service logs impa-ai \| grep "reminder-cron"` |
| **Dashboard** | `https://agentes.blackatende.com/admin/settings/cron` |
| **API** | `curl https://agentes.blackatende.com/api/admin/reminders/cron` |
| **Container** | `docker service ls \| grep impa-ai` |
| **Tudo** | `bash scripts/verify-cron-deployment.sh` |

---

**Última atualização**: 11 de novembro de 2025
