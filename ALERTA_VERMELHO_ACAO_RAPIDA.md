# 🚨 ALERTA VERMELHO NO DASHBOARD - O QUE FAZER?

Se você vê isto no dashboard:

```
⚠️ Cron Worker Não Está Rodando!
Worker não foi executado recentemente (últimas 65 minutos)
```

---

## ⚡ FIX EM 60 SEGUNDOS

### 1. Copiar o comando de debug
O alerta mostra um comando como este:
```bash
docker service logs impa-ai | grep "reminder-cron"
```

### 2. Executar no terminal VPS
```bash
docker service logs impa-ai 2>&1 | grep "reminder-cron"
```

### 3. Ver o resultado

**Se aparecer isto** (logs com [reminder-cron]):
```
[reminder-cron][2024-01-15 10:00:00] Worker iniciado
[reminder-cron][2024-01-15 10:01:00] Executando cron
```
→ Worker ESTÁ rodando, é um falso alarme. Aguarde um pouco.

**Se NÃO aparecer nada** (nem um [reminder-cron]):
```
(nenhuma output)
```
→ Worker REALMENTE não está rodando! Siga para Passo 4.

### 4. Se não aparecer nada, executar:
```bash
# Reconstruir
docker build --no-cache -t impa365/impa-ai:fix .

# Fazer push  
docker push impa365/impa-ai:fix

# Atualizar service
docker service update --force-update impa-ai

# Aguardar 1 minuto
sleep 60

# Verificar novamente
docker service logs impa-ai 2>&1 | grep "reminder-cron"
```

---

## 📊 MANUAL RÁPIDO POR ERRO

### "Cannot find module 'tsx'"
```
❌ ERRO: Cannot find module 'tsx'

AÇÃO:
npm install
docker build --no-cache -t impa365/impa-ai:fix .
docker push impa365/impa-ai:fix
docker service update --force-update impa-ai
```

---

### "No such file: /app/start.sh"
```
❌ ERRO: No such file or directory /app/start.sh

AÇÃO:
Verificar Dockerfile tem:
  COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
  ...
  EOF
  RUN chmod +x /app/start.sh

Se não tem, adicionar!
docker build --no-cache -t impa365/impa-ai:fix .
```

---

### "SUPABASE_URL not set"
```
❌ ERRO: SUPABASE_URL not set

AÇÃO:
docker-compose-production.yml deve ter:
  environment:
    - SUPABASE_URL=https://...
    - SUPABASE_SERVICE_ROLE_KEY=sk_...

Se não tem, adicionar!
docker stack deploy -c docker-compose-production.yml impa-ai
```

---

### "0/1 container exiting"
```
❌ ERRO: Service 0/1 (container falhando)

AÇÃO:
docker service logs impa-ai 2>&1 | tail -50

Procurar por: ERROR, FAIL, FATAL
Corrigir o erro específico
Rebuild + redeploy
```

---

### Nenhum erro, mas [reminder-cron] não aparece
```
⚠️ PROBLEMA: Container rodando mas sem logs [reminder-cron]

AÇÃO:
1. Ver todos os logs:
   docker service logs impa-ai 2>&1

2. Procurar por "Worker iniciado"
   Se não está, worker não vai iniciar

3. Procurar por "Executando cron"
   Se não está, cron não vai rodar

4. Verificar se "Ready - started server" aparece
   Significa Next.js rodando, worker pode estar falhando
   
5. Se só ver "Ready" mas sem "Worker iniciado":
   docker build --no-cache -t impa365/impa-ai:fix .
   É provável que start.sh não está sendo executado
```

---

## 🔍 DIAGNÓSTICO RÁPIDO - COPIE E COLE

```bash
echo "=== 1. SERVICE STATUS ==="
docker service ls | grep impa-ai

echo ""
echo "=== 2. NEXTJS RODANDO? ==="
docker service logs impa-ai 2>&1 | grep "Ready - started" | tail -1

echo ""
echo "=== 3. WORKER LOGS ==="
docker service logs impa-ai 2>&1 | grep "reminder-cron" | tail -5

echo ""
echo "=== 4. ÚLTIMOS ERROS ==="
docker service logs impa-ai 2>&1 | grep -i "error\|fail\|fatal" | tail -5

echo ""
echo "=== 5. IMAGEM ATUAL ==="
docker service inspect impa-ai | grep -i "image" | head -3
```

---

## 🎯 CHECKLIST DE VERIFICAÇÃO

Coloque um ✅ conforme você verifica:

- [ ] Service está 1/1 (rodando)
- [ ] "Ready - started server" aparece nos logs
- [ ] "[reminder-cron] Worker iniciado" aparece nos logs
- [ ] "[reminder-cron] Executando cron" aparece nos logs
- [ ] "[reminder-cron] Execução concluída" aparece nos logs
- [ ] Nenhum erro (ERROR/FAIL/FATAL) nos logs
- [ ] Dashboard não mostra alerta vermelho
- [ ] Lembretes estão sendo enviados

Se todos tiverem ✅ → **SUCESSO! Tudo funcionando!** 🎉

Se algum estiver vazio → **Siga o fix correspondente acima**

---

## 🆘 ÚLTIMO RECURSO

Se nada funcionar:

```bash
# Deletar service
docker service rm impa-ai

# Aguardar 10 segundos
sleep 10

# Redeployar do zero
docker stack deploy -c docker-compose-production.yml impa-ai

# Aguardar 2 minutos
sleep 120

# Verificar
docker service logs impa-ai 2>&1 | grep "reminder-cron"
```

---

**Qualquer dúvida, copie os logs e compartilhe comigo! 📋**
