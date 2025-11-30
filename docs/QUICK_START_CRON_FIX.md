# 🔥 QUICK START - Deploy do Cron Fix

**Tempo total: 20 minutos** ⏱️

---

## 1️⃣ PREPARAÇÃO (2 min)

```bash
# Atualizar repo
cd ~/impa-ai
git pull origin correcao-bugs

# Verificar mudanças
git status
```

**Esperado**: Deve mostrar `package.json`, `Dockerfile` e novos arquivos.

---

## 2️⃣ BUILD (5 min)

```bash
# Construir imagem
docker build -t impa365/impa-ai:correcao-bugs .

# Fazer push
docker push impa365/impa-ai:correcao-bugs
```

**Esperado**: "Successfully pushed" ou similar.

---

## 3️⃣ DEPLOY (3 min)

### Via Docker Swarm

```bash
# Deploy do stack
docker stack deploy -c docker-compose-production.yml impa-ai
```

### Via Portainer

1. Acesse seu Portainer
2. Clique em "Stacks"
3. Atualize "impa-ai" com `docker-compose-production.yml`
4. Clique "Deploy"

---

## 4️⃣ VERIFICAÇÃO (5 min)

```bash
# Ver status
docker service ls | grep impa-ai

# Ver logs (procure por "[reminder-cron]")
docker service logs impa-ai --tail 50

# Esperado:
# [reminder-cron][...] Worker iniciado ✅
# [reminder-cron][...] Executando cron ✅
```

---

## 5️⃣ TESTE (5 min)

### Opção A: Dashboard

```
https://agentes.blackatende.com/admin/settings/cron
```

✅ Deve mostrar:
- Status: "Executando"
- Próximas execuções
- Histórico

### Opção B: API

```bash
curl https://agentes.blackatende.com/api/admin/reminders/cron
```

✅ Resposta deve conter:
```json
{
  "success": true,
  "schedule": "0 * * * *",
  "lastRuns": [...]
}
```

---

## 🆘 SE NÃO FUNCIONAR

### Problema: "Worker não iniciou"

```bash
docker service logs impa-ai | grep -i "error\|fatal"
```

**Solução**: Verificar `SUPABASE_SERVICE_ROLE_KEY` no Docker Compose

### Problema: "Logs vazios"

```bash
docker service logs -f impa-ai
```

Aguarde 30 segundos para ver logs iniciais.

### Problema: "Container restartando"

```bash
docker service inspect impa-ai | grep -A 5 "Error"
```

Reconstruir Docker:
```bash
docker build --no-cache -t impa365/impa-ai:correcao-bugs .
```

---

## 📋 CHECKLIST FINAL

- [ ] Build concluído
- [ ] Push realizado
- [ ] Deploy realizado
- [ ] Logs mostram `[reminder-cron]`
- [ ] Dashboard acessível
- [ ] API respondendo

---

## 🎯 RESULTADO

```
✅ Cron rodando 24/7 em produção!
✅ Lembretes sendo enviados automaticamente!
✅ Dashboard de monitoramento disponível!
```

---

**Para mais detalhes**: Ler `CRON_DEPLOYMENT_GUIDE.md`

**Precisando ajuda?** Execute:
```bash
bash scripts/verify-cron-deployment.sh https://agentes.blackatende.com
```
