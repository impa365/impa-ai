# 🚫 Filtro de Registros Deletados - Bot Sessions

## 🎯 **Problema Resolvido**
Registros com `deleted_at` preenchido estavam aparecendo nas consultas do n8n, causando confusão e dados desnecessários.

## ✅ **Soluções Implementadas**

### 1️⃣ **VIEW `bot_sessions_active` (RECOMENDADO)**
```sql
-- Filtra automaticamente registros deletados
SELECT * FROM impaai.bot_sessions_active
WHERE "remoteJid" = '557381062304@s.whatsapp.net'
```

**Vantagens:**
- ✅ Filtro automático - nunca mostra registros deletados
- ✅ Performance otimizada com índices
- ✅ Compatível com todas as operações (SELECT, INSERT, UPDATE, DELETE)
- ✅ Não precisa lembrar de adicionar WHERE

### 2️⃣ **FUNÇÃO `get_active_bot_session()`**
```sql
-- Retorna apenas registros ativos para um remoteJid específico
SELECT * FROM impaai.get_active_bot_session('557381062304@s.whatsapp.net')
```

**Vantagens:**
- ✅ Filtro automático por remoteJid
- ✅ Performance otimizada
- ✅ Ideal para consultas específicas

### 3️⃣ **FILTRO MANUAL**
```sql
-- Adicionar WHERE em todas as consultas
SELECT * FROM impaai.bot_sessions 
WHERE "remoteJid" = '557381062304@s.whatsapp.net' 
AND deleted_at IS NULL
```

## 🔧 **Como Implementar no n8n**

### **Opção A: Usar a VIEW (Mais Fácil)**
1. **No n8n, mude a tabela:**
   - ❌ Antes: `bot_sessions`
   - ✅ Depois: `bot_sessions_active`

2. **Mantenha o resto da configuração igual:**
   - Schema: `impaai`
   - Resource: `Row`
   - Operation: `Get`
   - Filter: `remoteJid = {{ $('dados').item.json.remoteJid }}`

### **Opção B: Usar a FUNÇÃO**
1. **No n8n, use a função:**
   - Schema: `impaai`
   - Resource: `Function`
   - Operation: `Execute`
   - Function Name: `get_active_bot_session`
   - Parameters: `{{ $('dados').item.json.remoteJid }}`

### **Opção C: Adicionar Filtro Manual**
1. **No n8n, adicione filtro:**
   - Filter 1: `remoteJid = {{ $('dados').item.json.remoteJid }}`
   - Filter 2: `deleted_at = null`

## 📊 **Comparação das Soluções**

| Solução | Fácil de Usar | Performance | Flexibilidade | Recomendado |
|---------|---------------|-------------|---------------|-------------|
| VIEW | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ SIM |
| FUNÇÃO | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⚠️ Para casos específicos |
| FILTRO MANUAL | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ Propenso a erros |

## 🧪 **Teste das Soluções**

### **Teste 1: Verificar Views**
```sql
-- Deve retornar apenas registros ativos
SELECT COUNT(*) FROM impaai.bot_sessions_active;

-- Deve retornar apenas registros deletados
SELECT COUNT(*) FROM impaai.bot_sessions_deleted;

-- Deve retornar total
SELECT COUNT(*) FROM impaai.bot_sessions;
```

### **Teste 2: Verificar Função**
```sql
-- Deve retornar apenas registros ativos para o remoteJid
SELECT * FROM impaai.get_active_bot_session('557381062304@s.whatsapp.net');
```

## 🚀 **Implementação Recomendada**

### **Passo 1: Execute o Script SQL**
```bash
# No Supabase SQL Editor, execute:
database/filter_deleted_bot_sessions.sql
```

### **Passo 2: Atualize o n8n**
1. **Mude a tabela** de `bot_sessions` para `bot_sessions_active`
2. **Teste** com um remoteJid conhecido
3. **Verifique** que não retorna registros deletados

### **Passo 3: Validação**
- ✅ Registros deletados não aparecem mais
- ✅ Performance mantida ou melhorada
- ✅ Funcionalidade existente preservada

## 📝 **Arquivos Criados**

- ✅ `database/filter_deleted_bot_sessions.sql` - Script completo
- ✅ `docs/BOT_SESSIONS_FILTER_GUIDE.md` - Este guia

## 🎯 **Resultado Final**

**Antes:**
```json
{
  "sessionId": "91c1816f-f816-4903-8377-36f7abcdbb26",
  "remoteJid": "557381062304@s.whatsapp.net",
  "status": false,
  "deleted_at": "2025-10-29T14:11:13.322-03:00"  // ❌ Aparecia
}
```

**Depois:**
```json
// ✅ Registro deletado NÃO aparece mais!
// Apenas registros ativos (deleted_at IS NULL) são retornados
```

---

**🎉 Problema resolvido! Agora os registros deletados não aparecerão mais nas consultas do n8n!**
