# ⚡ VERIFICAÇÃO RÁPIDA - 30 SEGUNDOS

## Copie e Cole Este Comando:

```bash
docker service logs impa-ai | grep "reminder-cron" | tail -10
```

---

## Esperado Ver Isto:

```
[reminder-cron][2025-11-11T10:00:00Z] Worker iniciado
[reminder-cron][2025-11-11T10:00:00Z] Executando cron disparado por startup
[reminder-cron][2025-11-11T10:00:00Z] Execução concluída
```

### ✅ Se aparecer = Tudo OK!
### ❌ Se não aparecer = Ver troubleshooting abaixo

---

## TROUBLESHOOTING RÁPIDO

### ❌ "Comando não funciona"

```bash
# Tentar assim:
docker logs impa-ai 2>&1 | grep "reminder-cron" | tail -10
```

---

### ❌ "Nenhuma linha com [reminder-cron]"

```bash
# Ver todos os logs (últimas 100 linhas)
docker service logs impa-ai | tail -100
```

**Procure por:**
- ✅ `[reminder-cron]` = Cron está rodando
- ❌ `Cannot find module` = Docker quebrado
- ❌ `SUPABASE_URL` = Variável faltando

---

### ❌ "Muitos erros"

```bash
# Ver só erros
docker service logs impa-ai 2>&1 | grep -i "error\|fatal"
```

Se houver erros, envie a saída completa para:
- Documentação: `docs/CRON_DEPLOYMENT_GUIDE.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`

---

## SEGUNDA VERIFICAÇÃO - DASHBOARD

Abra no navegador:

```
https://agentes.blackatende.com/admin/settings/cron
```

✅ **Se carregar e mostrar dados = Cron está 100% OK!**

---

## TERCEIRA VERIFICAÇÃO - SUPER RÁPIDA

```bash
# Container rodando?
docker ps | grep impa-ai

# Esperado: Uma linha aparecendo
```

---

## RESUMO

| Verificação | Comando | Esperado |
|---|---|---|
| **Logs** | `docker service logs impa-ai \| grep "reminder-cron"` | `Worker iniciado` |
| **Dashboard** | Abrir URL | Mostra status |
| **Container** | `docker ps \| grep impa-ai` | Uma linha |

---

**Tudo OK? Cron está rodando! 🎉**

**Algo errado? Ler**: `HOW_TO_CHECK_CRON.md`
