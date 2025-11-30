# 🆘 CRON NÃO ESTÁ RODANDO NO DOCKER - SOLUÇÃO

Se você vê a mensagem:
```
❌ Cron Worker Não Está Rodando!
Worker não foi executado recentemente
```

## ⚡ FIX RÁPIDO (5 MINUTOS)

### Passo 1: Identificar o Problema

```bash
# Ver se há logs do [reminder-cron]
docker service logs impa-ai 2>&1 | grep "reminder-cron"
```

**Se NÃO aparecer nada** → Ir para Passo 2

**Se aparecer erro** → Ir para Troubleshooting

---

### Passo 2: Reconstruir e Fazer Deploy

```bash
# 1. Reconstruir sem cache
docker build --no-cache -t impa365/impa-ai:correcao-bugs .

# 2. Fazer push
docker push impa365/impa-ai:correcao-bugs

# 3. Reiniciar service (vai usar a nova imagem)
docker service update --force-update impa-ai

# 4. Aguardar 1 minuto
sleep 60

# 5. Verificar se funcionou
docker service logs impa-ai 2>&1 | grep "reminder-cron" | head -5
```

**Esperado ver:**
```
[reminder-cron][...] Worker iniciado ✅
```

---

## ❌ TROUBLESHOOTING DETALHADO

### Problema 1: "Cannot find module 'tsx'"

**Sintoma:**
```
Error: Cannot find module 'tsx'
```

**Causa:** `node_modules` não foi copiado para a imagem Docker

**Solução:**

Verifique o Dockerfile tem essas linhas:
```dockerfile
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts
```

Se faltarem, adicionar e reconstruir:
```bash
docker build --no-cache -t impa365/impa-ai:correcao-bugs .
docker push impa365/impa-ai:correcao-bugs
docker service update --force-update impa-ai
```

---

### Problema 2: "Script start.sh não encontrado"

**Sintoma:**
```
exec: /app/start.sh: No such file or directory
```

**Causa:** O script não foi copiado para a imagem

**Solução:** Verificar se o Dockerfile tem:
```dockerfile
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
...
EOF
RUN chmod +x /app/start.sh
```

Se faltarem, adicionar e reconstruir.

---

### Problema 3: "Variáveis de ambiente não definidas"

**Sintoma:**
```
[reminder-cron] ⚠️ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias
```

**Causa:** Faltam variáveis no docker-compose

**Solução:**

Verifique se `docker-compose-production.yml` tem:
```yaml
environment:
  - SUPABASE_URL=seu-valor
  - SUPABASE_SERVICE_ROLE_KEY=seu-valor
  - REMINDER_CRON_SECRET=seu-valor
```

Se faltarem, adicionar e fazer:
```bash
docker stack deploy -c docker-compose-production.yml impa-ai
```

---

### Problema 4: "Container restartando infinitamente"

**Sintoma:**
```
docker service ls | grep impa-ai
# Resultado: 0/1 (deveria ser 1/1)
```

**Causa:** Container está crashando

**Solução:**

Ver por que está falhando:
```bash
# Ver últimas 200 linhas de log
docker service logs impa-ai 2>&1 | tail -200
```

Procurar por erros (FATAL, ERROR, etc).

Reiniciar e observar:
```bash
# Forçar update
docker service update --force-update impa-ai

# Aguardar 30 segundos
sleep 30

# Ver logs
docker service logs impa-ai 2>&1 | tail -50
```

---

### Problema 5: "next start rodando, mas sem worker"

**Sintoma:**
```
docker service logs impa-ai 2>&1 | tail -20

Resultado: Só vê "Ready - started server..."
          Sem nenhum [reminder-cron]
```

**Causa:** O `start.sh` não está sendo executado corretamente

**Solução:**

Verifique o Dockerfile:
```dockerfile
CMD ["/app/start.sh"]
```

Deve ser este, NÃO `node server.js`!

Se estiver errado, corrigir e reconstruir:
```bash
docker build --no-cache -t impa365/impa-ai:correcao-bugs .
docker push impa365/impa-ai:correcao-bugs
docker service update --force-update impa-ai
```

---

## 📋 CHECKLIST DE DEBUG

Execute um comando por vez e me diga o resultado:

```bash
# 1. Container rodando?
echo "=== 1. STATUS ==="
docker service ls | grep impa-ai

# 2. Next.js iniciou?
echo "=== 2. NEXT.JS ==="
docker service logs impa-ai 2>&1 | grep "Ready - started"

# 3. Worker iniciou?
echo "=== 3. WORKER ==="
docker service logs impa-ai 2>&1 | grep "Worker iniciado"

# 4. Erros?
echo "=== 4. ERROS ==="
docker service logs impa-ai 2>&1 | grep -i "error\|fail\|fatal"

# 5. Últimas linhas
echo "=== 5. ÚLTIMAS 20 LINHAS ==="
docker service logs impa-ai 2>&1 | tail -20
```

---

## ✅ VERIFICAÇÃO FINAL

Se viu isso nos logs:
```
[reminder-cron][...] Worker iniciado           ✅
[reminder-cron][...] Executando cron           ✅
[reminder-cron][...] Execução concluída        ✅
```

**Então é só sucesso!** 🎉

---

## 🆘 AINDA NÃO FUNCIONOU?

Faça isso:

1. **Copie todos os logs:**
   ```bash
   docker service logs impa-ai 2>&1 > /tmp/impa-logs.txt
   cat /tmp/impa-logs.txt
   ```

2. **Procure por:**
   - `Cannot find module` → Problema de dependencies
   - `error\|Error\|ERROR` → Erro específico
   - `SUPABASE` → Variável faltando
   - Linhas após `🚀 Iniciando` → Startup

3. **Execute:**
   ```bash
   docker service inspect impa-ai | grep -i "image\|environment" | head -20
   ```

4. **Verifique:**
   - Dockerfile tem `COPY --from=builder /app/node_modules`?
   - Dockerfile tem `COPY --from=builder /app/scripts`?
   - Dockerfile CMD é `["/app/start.sh"]`?
   - docker-compose tem `SUPABASE_SERVICE_ROLE_KEY`?

---

## 📞 PRÓXIMAS AÇÕES

Se tudo acima não funcionou, siga este script:

```bash
# 1. Reconstruir do zero
docker image rm impa365/impa-ai:correcao-bugs
docker build --no-cache -t impa365/impa-ai:correcao-bugs .
docker push impa365/impa-ai:correcao-bugs

# 2. Redeployar
docker service rm impa-ai
sleep 10
docker stack deploy -c docker-compose-production.yml impa-ai

# 3. Aguardar 2 minutos
sleep 120

# 4. Verificar
docker service logs impa-ai 2>&1 | grep "reminder-cron"
```

---

**Agora o dashboard vai avisar automaticamente se o worker não estiver rodando! ✨**
