# 🔒 TESTE DE SEGURANÇA - Conexões WhatsApp

**Data:** 19/11/2025  
**Ambiente:** agentesteste.impa365.com  
**Branch:** correcao-bugs (commit 199e38f)

---

## 🎯 VULNERABILIDADES TESTADAS

### 1️⃣ Bypass de autenticação via parâmetros manipuláveis

**ANTES (Vulnerável):**
```bash
# Qualquer um podia passar isAdmin=true e ver TUDO
curl "https://agentesteste.impa365.com/api/whatsapp-connections?isAdmin=true"
```

**ESPERADO AGORA:**
- ❌ 401 Unauthorized (sem JWT válido)
- ✅ Retorna apenas conexões do usuário autenticado

---

### 2️⃣ Modificação do cookie para acessar dados de outros usuários

**ANTES (Vulnerável):**
```javascript
// No DevTools Console:
document.cookie = 'impaai_user={"id":"OUTRO_USER_ID","email":"atacante@exemplo.com","role":"user"}; path=/'

// Depois tentar acessar:
fetch('/api/user/whatsapp-connections')
```

**ESPERADO AGORA:**
- ✅ JWT inválido → 401 Unauthorized
- ✅ Ou fallback para cookie mas com validação de propriedade

---

### 3️⃣ Desconectar instância de outro usuário

**ANTES (Vulnerável):**
```bash
# Sem autenticação, qualquer um podia desconectar
curl -X DELETE "https://agentesteste.impa365.com/api/whatsapp/disconnect/INSTANCE_NAME"
```

**ESPERADO AGORA:**
- ❌ 401 Unauthorized (sem JWT)
- ❌ 403 Forbidden (não é dono da conexão)

---

### 4️⃣ Acessar informações de conexão de outro usuário

**ANTES (Vulnerável):**
```bash
curl "https://agentesteste.impa365.com/api/whatsapp-connections/info/CONNECTION_ID"
```

**ESPERADO AGORA:**
- ❌ 401 Unauthorized (sem JWT)
- ❌ 403 Forbidden (não é dono)
- ✅ 200 OK apenas se for dono ou admin

---

## 📋 CHECKLIST DE TESTES

### Teste 1: Parâmetros manipuláveis
- [ ] Tentar `?isAdmin=true` sem autenticação
- [ ] Tentar `?isAdmin=true` como usuário comum
- [ ] Verificar se admin vê tudo, user vê só suas conexões

### Teste 2: Manipulação de cookie
- [ ] Modificar `id` no cookie `impaai_user`
- [ ] Tentar acessar `/api/user/whatsapp-connections`
- [ ] Verificar se JWT invalida o ataque

### Teste 3: Operações DELETE
- [ ] Tentar deletar instância sem autenticação
- [ ] Tentar deletar instância de outro usuário
- [ ] Verificar se apenas dono/admin consegue

### Teste 4: Validação de propriedade
- [ ] Acessar conexão própria (deve funcionar)
- [ ] Acessar conexão de outro user (deve bloquear)
- [ ] Admin acessar qualquer conexão (deve funcionar)

---

## 📊 RESULTADOS

### ✅ APROVADO
- [ ] Todas as rotas validam JWT
- [ ] Parâmetros de URL não bypassam autenticação
- [ ] Validação de propriedade funciona
- [ ] Admins têm acesso apropriado

### ❌ FALHOU
- [ ] (Documentar aqui se algum teste falhar)

---

## 🛠️ COMANDOS ÚTEIS

### Ver cookies no navegador (DevTools Console):
```javascript
document.cookie
```

### Fazer requisição com fetch:
```javascript
fetch('/api/whatsapp-connections?isAdmin=true')
  .then(r => r.json())
  .then(console.log)
```

### Ver headers da resposta:
```javascript
fetch('/api/whatsapp-connections?isAdmin=true')
  .then(r => {
    console.log('Status:', r.status)
    console.log('Headers:', [...r.headers])
    return r.json()
  })
  .then(console.log)
```

### Modificar cookie e testar:
```javascript
// 1. Ver cookie atual
console.log(document.cookie)

// 2. Modificar (trocar o ID)
document.cookie = 'impaai_user={"id":"ID_FAKE","email":"fake@exemplo.com","role":"user"}; path=/; domain=agentesteste.impa365.com'

// 3. Tentar acessar
fetch('/api/user/whatsapp-connections')
  .then(r => r.json())
  .then(console.log)
```

---

## 📝 NOTAS

- **Importante:** Este é um ambiente de TESTE (agentesteste.impa365.com)
- Todas as tentativas de invasão são legítimas para validar a segurança
- Documentar cada resultado encontrado
