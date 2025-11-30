# 🧪 Testes de Segurança - Página de Agentes

## ⚠️ IMPORTANTE
Execute estes testes **SOMENTE em ambiente de desenvolvimento ou teste**.
Nunca execute em produção sem autorização.

---

## 🎯 Teste 1: Tentar acessar agentes SEM autenticação

```javascript
// Limpar cookies e tentar acessar
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Tentar buscar agentes sem JWT
fetch('/api/user/agents', {
  method: 'GET',
  credentials: 'omit' // Forçar não enviar cookies
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.log('✅ SEGURO: Bloqueou acesso sem autenticação');
    console.log('Erro retornado:', data.error);
  } else {
    console.log('❌ VULNERÁVEL: Retornou dados sem autenticação!');
    console.log('Dados vazados:', data);
  }
})
.catch(err => console.log('Erro na requisição:', err));
```

---

## 🎯 Teste 2: Tentar manipular cookie para ver agentes de outro usuário

```javascript
// Simulação: Modificar user_id no cookie (se ainda aceitar JSON)
const fakeCookie = JSON.stringify({
  id: '00000000-0000-0000-0000-000000000000', // ID de outro usuário
  email: 'hacker@evil.com',
  role: 'user'
});

document.cookie = `impaai_user=${fakeCookie}; path=/`;

fetch('/api/user/agents', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  if (data.error && data.error.includes('autorizado')) {
    console.log('✅ SEGURO: Cookie JSON não é aceito, apenas JWT');
    console.log('Erro:', data.error);
  } else if (data.agents) {
    console.log('❌ VULNERÁVEL: Aceitou cookie manipulado!');
    console.log('Agentes retornados:', data.agents.length);
  }
})
.catch(err => console.log('Erro:', err));
```

---

## 🎯 Teste 3: Tentar criar agente SEM autenticação

```javascript
fetch('/api/user/agents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'omit',
  body: JSON.stringify({
    name: 'Agente Hacker',
    identity_description: 'Teste de segurança',
    whatsapp_connection_id: '123',
    trigger_value: 'hack'
  })
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.log('✅ SEGURO: Bloqueou criação sem autenticação');
    console.log('Erro:', data.error);
  } else {
    console.log('❌ VULNERÁVEL: Criou agente sem autenticação!');
    console.log('Agente criado:', data);
  }
})
.catch(err => console.log('Erro:', err));
```

---

## 🎯 Teste 4: Tentar DELETAR agente de outro usuário

```javascript
// Primeiro, pegar ID de um agente (assumindo que você está autenticado)
fetch('/api/user/agents')
.then(r => r.json())
.then(data => {
  if (data.agents && data.agents.length > 0) {
    const agentId = data.agents[0].id;
    console.log('Tentando deletar agente:', agentId);
    
    // Tentar deletar sem JWT válido
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    return fetch(`/api/user/agents/${agentId}`, {
      method: 'DELETE',
      credentials: 'omit'
    });
  } else {
    console.log('⚠️ Nenhum agente disponível para teste');
    throw new Error('Sem agentes');
  }
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.log('✅ SEGURO: Bloqueou deleção sem autenticação');
    console.log('Erro:', data.error);
  } else {
    console.log('❌ VULNERÁVEL: Deletou agente sem autenticação!');
  }
})
.catch(err => console.log('Teste não executado:', err.message));
```

---

## 🎯 Teste 5: Tentar EDITAR agente com user_id manipulado

```javascript
// Tentar editar agente forçando outro user_id no payload
fetch('/api/user/agents')
.then(r => r.json())
.then(data => {
  if (data.agents && data.agents.length > 0) {
    const agentId = data.agents[0].id;
    console.log('Tentando editar agente:', agentId);
    
    return fetch(`/api/user/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: '00000000-0000-0000-0000-000000000000', // Tentar mudar dono
        name: 'Agente Hackeado'
      })
    });
  } else {
    throw new Error('Sem agentes');
  }
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.log('✅ SEGURO: Bloqueou alteração de propriedade');
    console.log('Erro:', data.error);
  } else {
    console.log('⚠️ VERIFICAR: Agente foi editado');
    console.log('Verifique se o user_id foi mantido original');
    console.log('Resposta:', data);
  }
})
.catch(err => console.log('Teste não executado:', err.message));
```

---

## 🎯 Teste 6: Verificar rate limiting no GET de agentes

```javascript
console.log('🔄 Testando rate limiting (60 requisições/min)...');

let successCount = 0;
let blockedCount = 0;

async function testRateLimit() {
  for (let i = 1; i <= 65; i++) {
    try {
      const response = await fetch('/api/user/agents', {
        method: 'GET'
      });
      
      if (response.status === 429) {
        blockedCount++;
        const data = await response.json();
        console.log(`🚫 Requisição ${i}: BLOQUEADA (Rate Limit)`);
        console.log(`   Aguardar: ${data.error}`);
        if (i === 61) {
          console.log('✅ SEGURO: Rate limit funcionando após 60 requisições');
        }
        break;
      } else if (response.ok) {
        successCount++;
        if (i % 10 === 0) {
          console.log(`✓ Requisição ${i}: OK`);
        }
      }
    } catch (err) {
      console.log(`❌ Erro na requisição ${i}:`, err.message);
      break;
    }
    
    // Pequeno delay para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n📊 Resultado do teste:');
  console.log(`   Sucessos: ${successCount}`);
  console.log(`   Bloqueadas: ${blockedCount}`);
  
  if (blockedCount > 0 && successCount <= 60) {
    console.log('✅ Rate limiting está funcionando corretamente!');
  } else if (successCount > 60) {
    console.log('❌ Rate limiting NÃO está funcionando!');
  }
}

testRateLimit();
```

---

## 🎯 Teste 7: Verificar se informações sensíveis vazam

```javascript
fetch('/api/user/agents')
.then(r => r.json())
.then(data => {
  if (data.agents && data.agents.length > 0) {
    const agent = data.agents[0];
    console.log('🔍 Verificando dados do agente...');
    
    const sensitiveFields = [
      'llm_api_key',
      'voice_api_key', 
      'calendar_api_key',
      'chatnode_api_key',
      'orimon_api_key'
    ];
    
    let leaked = [];
    sensitiveFields.forEach(field => {
      if (agent[field] && agent[field] !== null && agent[field] !== '') {
        leaked.push(field);
      }
    });
    
    if (leaked.length > 0) {
      console.log('❌ VULNERÁVEL: API Keys expostas na resposta!');
      console.log('Campos vazados:', leaked);
      leaked.forEach(field => {
        console.log(`   ${field}: ${agent[field].substring(0, 10)}...`);
      });
    } else {
      console.log('✅ SEGURO: Nenhuma API key exposta');
    }
    
    // Verificar conexões WhatsApp
    if (data.connections && data.connections.length > 0) {
      const conn = data.connections[0];
      if (conn.instance_token) {
        console.log('❌ VULNERÁVEL: instance_token exposto!');
        console.log('   Token:', conn.instance_token.substring(0, 15) + '...');
      } else {
        console.log('✅ SEGURO: instance_token não exposto');
      }
    }
  } else {
    console.log('⚠️ Nenhum agente para verificar');
  }
})
.catch(err => console.log('Erro:', err));
```

---

## 🎯 Teste 8: Tentar acessar agente específico de outro usuário

```javascript
// Tentar adivinhar/forçar ID de agente de outro usuário
const fakeAgentId = '00000000-0000-0000-0000-000000000001';

fetch(`/api/user/agents/${fakeAgentId}`, {
  method: 'GET'
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.log('✅ SEGURO: Bloqueou acesso a agente de outro usuário');
    console.log('Erro:', data.error);
  } else if (data.agent) {
    console.log('❌ VULNERÁVEL: Retornou agente de outro usuário!');
    console.log('Agente:', data.agent);
  }
})
.catch(err => console.log('Erro:', err));
```

---

## 🎯 TESTE COMPLETO - Executar todos de uma vez

```javascript
console.log('🧪 Iniciando bateria de testes de segurança - Agentes\n');
console.log('═'.repeat(60));

const tests = [];

// Teste 1: Sem autenticação
tests.push({
  name: 'GET sem autenticação',
  run: async () => {
    const r = await fetch('/api/user/agents', { credentials: 'omit' });
    const data = await r.json();
    return data.error ? '✅' : '❌';
  }
});

// Teste 2: POST sem autenticação
tests.push({
  name: 'POST sem autenticação',
  run: async () => {
    const r = await fetch('/api/user/agents', {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Teste' })
    });
    const data = await r.json();
    return data.error ? '✅' : '❌';
  }
});

// Teste 3: Cookie JSON manipulado (NOVA CORREÇÃO)
tests.push({
  name: 'Cookie JSON manipulado',
  run: async () => {
    // Criar cookie falso
    const fakeCookie = JSON.stringify({
      id: '00000000-0000-0000-0000-000000000000',
      email: 'hacker@evil.com',
      role: 'admin'
    });
    document.cookie = `impaai_user=${fakeCookie}; path=/`;
    
    const r = await fetch('/api/user/agents');
    const data = await r.json();
    
    // Limpar cookie falso
    document.cookie = 'impaai_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    return data.error ? '✅' : '❌';
  }
});

// Teste 4: Rate Limiting (NOVA CORRE��ÃO)
tests.push({
  name: 'Rate Limiting (61 requisições)',
  run: async () => {
    let blocked = false;
    for (let i = 1; i <= 61; i++) {
      const r = await fetch('/api/user/agents');
      if (r.status === 429) {
        blocked = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    return blocked ? '✅' : '❌';
  }
});

// Teste 5: Verificar se API keys vazam
tests.push({
  name: 'Verificar vazamento de API keys',
  run: async () => {
    const r = await fetch('/api/user/agents');
    const data = await r.json();
    if (!data.agents || data.agents.length === 0) return '⚠️';
    
    const agent = data.agents[0];
    const hasKeys = agent.llm_api_key || agent.voice_api_key || agent.calendar_api_key;
    return hasKeys ? '❌' : '✅';
  }
});

// Teste 6: Verificar instance_token nas conexões
tests.push({
  name: 'Verificar vazamento de instance_token',
  run: async () => {
    const r = await fetch('/api/user/agents');
    const data = await r.json();
    if (!data.connections || data.connections.length === 0) return '⚠️';
    
    const conn = data.connections[0];
    return conn.instance_token ? '❌' : '✅';
  }
});

// Executar testes
(async () => {
  for (const test of tests) {
    try {
      const result = await test.run();
      console.log(`${result} ${test.name}`);
    } catch (err) {
      console.log(`⚠️ ${test.name} - Erro: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }
  
  console.log('═'.repeat(60));
  console.log('\n📊 Resultado esperado após correções:');
  console.log('✅ GET sem autenticação');
  console.log('✅ POST sem autenticação');
  console.log('✅ Cookie JSON manipulado');
  console.log('✅ Rate Limiting (61 requisições)');
  console.log('✅ Verificar vazamento de API keys');
  console.log('✅ Verificar vazamento de instance_token');
  console.log('\n✅ = Seguro | ❌ = Vulnerável | ⚠️ = Não testável');
})();
```

---

## 📋 Checklist de Segurança Esperado

Após executar os testes, o sistema deve:

- ✅ Bloquear acesso sem JWT válido
- ✅ Não aceitar cookies JSON manipulados
- ✅ Validar propriedade dos agentes (user_id)
- ✅ Não expor API keys nas respostas
- ✅ Não expor instance_token das conexões
- ✅ Aplicar rate limiting (60 req/min para GET)
- ✅ Registrar tentativas suspeitas nos logs

---

## 🔍 Como verificar os logs no servidor

No terminal do servidor, você verá:

```bash
# Logs de segurança
📋 [SECURITY-INFO] Operações normais
⚠️ [SECURITY-WARNING] Tentativas bloqueadas
🚨 [SECURITY-CRITICAL] Ataques detectados

# Exemplos:
⚠️ [SECURITY-WARNING] ACCESS_DENIED | User: undefined | Resource: /api/user/agents
⚠️ [SECURITY-WARNING] RATE_LIMIT_EXCEEDED | User: user@test.com | Resource: /api/user/agents
```

---

## 🚀 Como usar

1. **Abra o navegador** em http://localhost:3000/dashboard/agents
2. **Abra o DevTools** (F12)
3. **Vá para Console**
4. **Cole e execute** cada teste individualmente OU
5. **Execute o TESTE COMPLETO** para verificar tudo de uma vez

**IMPORTANTE:** Faça login primeiro se quiser testar com autenticação válida!
