# 🔐 TESTE JWT - Pós Deploy

**Problema identificado:** Usuário logado antes do deploy não tem JWT

## 🧪 TESTES A FAZER:

### 1️⃣ Fazer logout e login novamente

No console do navegador:
```javascript
// Verificar cookies atuais
document.cookie.split(';').forEach(c => console.log(c.trim()))
```

### 2️⃣ Após novo login, verificar se JWT foi criado

```javascript
// Verificar se tem JWT
document.cookie.split(';').find(c => c.includes('impaai_access_token'))
```

### 3️⃣ Testar ataque novamente

```javascript
fetch('/api/whatsapp-connections?isAdmin=true')
  .then(r => {
    console.log('🎯 Status:', r.status)
    return r.json()
  })
  .then(data => {
    console.log('📦 Resposta:', data)
    if (data.error && r.status === 401) {
      console.log('✅✅✅ JWT FUNCIONANDO - Bloqueado com 401!')
    } else if (data.connections) {
      console.log('⚠️ Ainda usando fallback')
    }
  })
```

---

## 📊 RESULTADO ESPERADO APÓS NOVO LOGIN:

**Logs do servidor deverão mostrar:**
```
✅ Usuário autenticado via JWT (cookie): joao@teste.com
✅ [JWT-AUTH] joao@teste.com - Cookie JWT
```

**Ao invés de:**
```
⚠️ Usando fallback de cookie JSON (não seguro) - migrar para JWT
```
