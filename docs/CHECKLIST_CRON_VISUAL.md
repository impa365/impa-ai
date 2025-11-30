# 📋 CHECKLIST VISUAL - Cron Worker no Docker

## 🎯 OBJETIVO FINAL
Garantir que o cron worker esteja rodando no Docker e enviando lembretes automaticamente.

---

## 📊 STATUS ATUAL (Preenchimento Automático)

Use este checklist para acompanhar seu progresso:

```
[ ] Docker service rodando (impa-ai 1/1)
[ ] Next.js inicializado 
[ ] Cron worker inicializado
[ ] [reminder-cron] logs aparecendo
[ ] Últimas 20 linhas sem erros
[ ] Dockerfile correto
[ ] docker-compose atualizado
[ ] npm install com sucesso
[ ] start.sh com permissão de execução
[ ] Variáveis SUPABASE no docker-compose
```

---

## 🔄 PROCESSO DE FIX (Siga na ordem)

### ✅ PASSO 1: Validar Dockerfile
**O que esperar:** Arquivo contém `COPY --from=builder /app/node_modules` e `CMD ["/app/start.sh"]`

```bash
# Executar este comando:
grep -E "COPY.*node_modules|CMD.*start.sh" Dockerfile

# Esperado ver:
# COPY --from=builder /app/node_modules ./node_modules
# CMD ["/app/start.sh"]
```

**Status:** 
- [ ] Ambas as linhas presentes ✅
- [ ] Faltam linhas (corrigir Dockerfile) ❌

---

### ✅ PASSO 2: Validar docker-compose-production.yml
**O que esperar:** Arquivo tem `SUPABASE_SERVICE_ROLE_KEY` e outras variáveis

```bash
# Executar:
grep "SUPABASE_SERVICE_ROLE_KEY\|REMINDER_CRON_SECRET\|NODE_ENV" docker-compose-production.yml | head -10

# Esperado ver:
# - SUPABASE_SERVICE_ROLE_KEY=sk_...
# - REMINDER_CRON_SECRET=...
# - NODE_ENV=production
```

**Status:**
- [ ] Todas as variáveis presentes ✅
- [ ] Faltam variáveis (atualizar arquivo) ❌

---

### ✅ PASSO 3: Reconstruir Docker Image
**O que esperar:** Build completa sem erros

```bash
# Executar (leva 3-5 minutos):
docker build --no-cache -t impa365/impa-ai:fix .

# Esperado ver no final:
# => => writing image sha256:xxx [=====>] 100%
# => => naming to docker.io/impa365/impa-ai:fix
```

**Status:**
- [ ] Build completada sem erros ✅
- [ ] Erro "Cannot find module" - falta dependência ❌
- [ ] Erro "No such file" - arquivo não encontrado ❌

---

### ✅ PASSO 4: Fazer Push da Imagem
**O que esperar:** Imagem é enviada para Docker Hub

```bash
# Executar:
docker push impa365/impa-ai:fix

# Esperado ver:
# Pushing layers... 100%
# Digest: sha256:xxx
# Status: Image successfully pushed
```

**Status:**
- [ ] Push completado ✅
- [ ] Erro de autenticação (docker login) ❌

---

### ✅ PASSO 5: Atualizar Service
**O que esperar:** Service reinicia com a nova imagem

```bash
# Executar:
docker service update --force-update impa-ai

# Aguardar 30 segundos
sleep 30

# Executar:
docker service ls | grep impa-ai

# Esperado ver:
# impa-ai          replicated   1/1       impa365/impa-ai:fix
```

**Status:**
- [ ] Service atualizado (1/1) ✅
- [ ] Service reiniciando (0/1) - aguardar mais tempo ⏳
- [ ] Service falhou - ver logs ❌

---

### ✅ PASSO 6: Verificar Logs do Worker
**O que esperar:** Ver `[reminder-cron]` iniciando e executando

```bash
# Executar (5 minutos após update):
docker service logs impa-ai 2>&1 | grep "reminder-cron"

# Esperado ver:
# [reminder-cron][2024-XX-XX HH:MM:SS] Worker iniciado
# [reminder-cron][2024-XX-XX HH:MM:SS] Executando cron...
# [reminder-cron][2024-XX-XX HH:MM:SS] Execução concluída
```

**Status:**
- [ ] Logs aparecem com sucesso ✅
- [ ] Nenhum log [reminder-cron] - worker não iniciou ❌
- [ ] Erros nos logs - ver abaixo ❌

---

### ✅ PASSO 7: Testar Dashboard
**O que esperar:** Dashboard mostra status do worker

```bash
# Abrir no browser:
https://agentes.blackatende.com/admin/settings/cron

# Se worker está rodando:
# ✅ "Cron Worker Está Rodando"
# ✅ Mostra "Última execução: XX minutos atrás"
# ✅ Mostra lista de execuções recentes

# Se worker NÃO está rodando:
# ❌ Card vermelho: "⚠️ Cron Worker Não Está Rodando!"
# ❌ Com instruções de debug
```

**Status:**
- [ ] Dashboard mostra tudo normal ✅
- [ ] Dashboard mostra alerta vermelho - diagnosticar ❌

---

### ✅ PASSO 8: Verificar Lembretes Sendo Enviados
**O que esperar:** Lembretes são enviados conforme schedule

```bash
# Nos logs, procurar por:
docker service logs impa-ai 2>&1 | grep -i "lembrete\|reminder\|enviado" | tail -10

# Ou no dashboard:
# Abrir: https://agentes.blackatende.com/admin/settings/cron
# Procurar por "Execuções recentes" com status "✅ SUCESSO"
```

**Status:**
- [ ] Lembretes sendo enviados ✅
- [ ] Nenhum lembrete (verificar triggers) ⏳
- [ ] Erros ao enviar - ver logs ❌

---

## 🆘 TROUBLESHOOTING POR ERRO

### Erro 1: "Cannot find module 'tsx'"
```
Estado: ❌ BUILD FAILED
Causa: npm install não incluiu tsx

Solução:
1. Verifique se tsx está em package.json
2. Remova package-lock.yaml
3. Execute: npm install
4. Rebuild: docker build --no-cache -t impa365/impa-ai:fix .
```

### Erro 2: "No such file or directory: /app/start.sh"
```
Estado: ❌ SERVICE CRASHING
Causa: start.sh não foi copiado

Solução:
1. Verifique Dockerfile tem: COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
2. Verifique se: RUN chmod +x /app/start.sh está presente
3. Rebuild: docker build --no-cache -t impa365/impa-ai:fix .
```

### Erro 3: "[reminder-cron] Variáveis SUPABASE não definidas"
```
Estado: ❌ WORKER INICIANDO MAS FALHANDO
Causa: Faltam variáveis no docker-compose

Solução:
1. Adicionar ao docker-compose-production.yml:
   - SUPABASE_URL=https://...
   - SUPABASE_SERVICE_ROLE_KEY=sk_...
   - REMINDER_CRON_SECRET=seu-secret
2. Deploy: docker stack deploy -c docker-compose-production.yml impa-ai
```

### Erro 4: "Service 0/1 (container exiting)"
```
Estado: ❌ CONTAINER CRASHANDO
Causa: Erro ao iniciar - precisa ver logs detalhados

Solução:
1. Ver últimos 200 linhas: docker service logs impa-ai 2>&1 | tail -200
2. Procurar por: ERROR, FATAL, panic
3. Correção depende do erro específico
```

---

## ✅ CONFIRMAÇÃO DE SUCESSO

Quando tudo funcionar, você verá:

### 1️⃣ No Terminal
```bash
$ docker service logs impa-ai 2>&1 | grep "reminder-cron"
[reminder-cron][2024-01-15 10:00:00] Worker iniciado
[reminder-cron][2024-01-15 10:01:00] Executando cron (1 triggers a executar)
[reminder-cron][2024-01-15 10:01:05] Enviado lembrete para usuario@example.com
[reminder-cron][2024-01-15 10:01:10] Execução concluída (1 lembretes enviados)
```

### 2️⃣ No Dashboard
```
✅ Cron Worker Está Rodando
   Última execução: há 5 minutos
   Status: SUCESSO
   
📊 Estatísticas:
   Execuções totais: 120
   Sucesso: 120
   Falhas: 0
   
📋 Últimas Execuções:
   15/01/2024 10:01 | SUCESSO | 1 lembrete enviado
   15/01/2024 10:00 | SUCESSO | 2 lembretes enviados
```

### 3️⃣ Em Produção
- ✅ Lembretes sendo enviados automaticamente
- ✅ Usuários recebendo notificações
- ✅ Nenhuma intervenção manual necessária

---

## 📞 RELATÓRIO DE SUCESSO

Se chegou até aqui com tudo verde:

```bash
# Copie este comando e execute:
echo "🎉 CRON WORKER FUNCIONANDO COM SUCESSO!" && \
docker service ls | grep impa-ai && \
docker service logs impa-ai 2>&1 | grep "reminder-cron" | tail -3 && \
date
```

**Compartilhe o output comigo para confirmar!** 🚀

---

## 🚨 CASO NÃO FUNCIONE APÓS TUDO ISSO

Siga este protocolo:

```bash
# 1. Colete os logs completos (últimas 2 horas)
docker service logs impa-ai 2>&1 > /tmp/impa-debug-$(date +%s).txt

# 2. Verifique o tamanho
ls -lh /tmp/impa-debug-*.txt

# 3. Inspecione o service
docker service inspect impa-ai > /tmp/impa-service-$(date +%s).json

# 4. Compartilhe estes 2 arquivos para análise detalhada
cat /tmp/impa-debug-*.txt
cat /tmp/impa-service-*.json
```

---

**Boa sorte! Você está no caminho certo! 🚀**
