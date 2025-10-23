# 📚 Documentação - Integração Uazapi

## 🎯 Visão Geral

Esta documentação descreve a implementação completa do suporte para **duas APIs de WhatsApp** no sistema:
- **Evolution API** (API original)
- **Uazapi** (Nova API alternativa)

Os usuários agora podem escolher qual API utilizar ao criar uma conexão WhatsApp.

---

## 📋 O Que Foi Implementado

### 1. **Banco de Dados**

#### ✅ Campo `api_type` adicionado à tabela `whatsapp_connections`

**Arquivo:** `database/add_api_type_to_whatsapp_connections.sql`

```sql
-- Adiciona o campo que identifica qual API está sendo usada
ALTER TABLE impaai.whatsapp_connections
ADD COLUMN IF NOT EXISTS api_type VARCHAR(50) NOT NULL DEFAULT 'evolution';

-- Validação para aceitar apenas 'evolution' ou 'uazapi'
ALTER TABLE impaai.whatsapp_connections
ADD CONSTRAINT whatsapp_connections_api_type_check 
CHECK (api_type IN ('evolution', 'uazapi'));
```

**Para aplicar:**
```bash
# Execute o script no seu banco de dados Supabase
psql -h seu-host -U seu-usuario -d sua-database -f database/add_api_type_to_whatsapp_connections.sql
```

---

### 2. **Cliente Uazapi**

#### ✅ Bibliotecas para integração com Uazapi

**Arquivos:**
- `lib/uazapi-client.ts` - Funções para uso no **front-end** (componentes React)
- `lib/uazapi-server.ts` - Funções para uso no **back-end** (API routes) ⭐ **NOVO**

> **⚠️ IMPORTANTE - Segurança:**  
> A versão **server** (`uazapi-server.ts`) deve ser usada APENAS em API routes (back-end).  
> Ela acessa o banco de dados diretamente e não faz requisições HTTP internas.  
> **Nunca** importe funções sensíveis no front-end!

**Funções Implementadas:**

##### 📡 **Gerenciamento de Instâncias**
- `createUazapiInstance(instanceName)` - Cria nova instância
- `connectUazapiInstance(token, phone?)` - Conecta instância (QR Code ou pareamento)
- `disconnectUazapiInstance(token)` - Desconecta instância
- `getUazapiInstanceStatus(token)` - Verifica status
- `updateUazapiInstanceName(token, newName)` - Atualiza nome
- `deleteUazapiInstance(token)` - Deleta instância
- `listAllUazapiInstances()` - Lista todas (admin only)

##### 🔒 **Configurações de Privacidade**
- `getUazapiPrivacySettings(token)` - Busca configurações
- `updateUazapiPrivacySettings(token, settings)` - Atualiza configurações

##### 👤 **Gerenciamento de Perfil**
- `updateUazapiProfileName(token, name)` - Atualiza nome do perfil
- `updateUazapiProfileImage(token, image)` - Atualiza foto do perfil

##### ⚙️ **Configuração**
- `getUazapiConfig()` - Busca configurações do banco
- `isUazapiConfigured()` - Verifica se está configurada

---

### 3. **Camada de Abstração (Router)**

#### ✅ Roteamento automático entre APIs

**Arquivo:** `lib/whatsapp-api-router.ts`

Esta camada roteia automaticamente as chamadas para a API correta baseado no campo `api_type` da conexão.

**Funções Disponíveis:**
```typescript
// Todas aceitam ConnectionInfo que contém o campo api_type
createInstance(apiType, connectionName, userId)
connectInstance(connection, phoneNumber?)
disconnectInstance(connection)
getInstanceStatus(connection)
deleteInstance(connection)
updateInstanceName(connection, newName)
getPrivacySettings(connection)
updatePrivacySettings(connection, settings)
updateProfileName(connection, name)
updateProfileImage(connection, image)
```

**Exemplo de Uso:**
```typescript
import { connectInstance, getConnectionInfo } from '@/lib/whatsapp-api-router'

// Buscar informações da conexão
const connection = await getConnectionInfo(connectionId)

// Conectar (roteia automaticamente para Evolution ou Uazapi)
const result = await connectInstance(connection)
```

---

### 4. **Interface do Usuário**

#### ✅ Seletor de API no formulário de criação

**Arquivo:** `components/whatsapp-connection-modal.tsx`

**Mudanças:**
- ✅ Campo de seleção `apiType` adicionado
- ✅ Opções: "Evolution API" ou "Uazapi"
- ✅ Descrições claras para cada opção
- ✅ Valor enviado na criação da conexão

**Visual:**
```
┌─────────────────────────────────────────┐
│  Tipo de API WhatsApp                   │
│  ┌───────────────────────────────────┐  │
│  │ Evolution API                      │  │
│  │ API oficial com EvolutionBot       │  │
│  └───────────────────────────────────┘  │
│                                          │
│  Nome da Conexão                         │
│  ┌───────────────────────────────────┐  │
│  │ minha_conexao                      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

### 5. **API de Backend**

#### ✅ Endpoint atualizado para suportar ambas APIs

**Arquivo:** `app/api/whatsapp/create-instance/route.ts`

**Mudanças:**
- ✅ Aceita parâmetro `apiType` no body
- ✅ Cria instância na API selecionada (Evolution ou Uazapi)
- ✅ Salva `api_type` no banco de dados
- ✅ Retorna dados da API utilizada

**Fluxo:**
1. Recebe `connectionName`, `userId`, `apiType`
2. Gera `instanceName` e `token` únicos
3. Se `apiType === 'uazapi'`:
   - Chama `createUazapiInstance()`
   - Usa token retornado pela Uazapi
4. Se `apiType === 'evolution'`:
   - Chama Evolution API `/instance/create`
   - Usa token gerado localmente
5. Salva conexão no banco com campo `api_type`

---

## 🚀 Como Usar

### 1. **Configurar a Integração Uazapi**

1. Acesse **Admin → Configurações → Integrações**
2. Clique em **Configurar** no card "Uazapi"
3. Preencha:
   - **URL do Servidor**: `https://free.uazapi.com` (ou seu servidor)
   - **API Key Global**: Seu token de administrador
4. Clique em **Salvar**

### 2. **Executar o Script SQL**

Execute o script para adicionar o campo `api_type`:

```bash
# Conecte ao seu banco Supabase e execute:
cat database/add_api_type_to_whatsapp_connections.sql | psql -h seu-host -U seu-usuario -d sua-database
```

Ou execute manualmente no Supabase SQL Editor.

### 3. **Criar Conexão com Uazapi**

1. Vá para **Dashboard → WhatsApp**
2. Clique em **Nova Conexão**
3. Selecione **Tipo de API**: "Uazapi"
4. Digite o nome da conexão
5. Clique em **Criar Conexão**

### 4. **Usar as Funções**

#### Exemplo: Conectar Instância

```typescript
import { connectInstance } from '@/lib/whatsapp-api-router'

const connection = {
  id: 'uuid-da-conexao',
  api_type: 'uazapi', // ou 'evolution'
  instance_name: 'impaai_teste_1234',
  instance_token: 'token-da-instancia',
  user_id: 'user-id'
}

const result = await connectInstance(connection)
if (result.success) {
  console.log('QR Code:', result.data.instance.qrcode)
  console.log('Pair Code:', result.data.instance.paircode)
}
```

#### Exemplo: Atualizar Nome do Perfil

```typescript
import { updateProfileName } from '@/lib/whatsapp-api-router'

const result = await updateProfileName(connection, 'Minha Empresa')
if (result.success) {
  console.log('Nome do perfil atualizado!')
}
```

---

## 📊 Comparação: Evolution vs Uazapi

| Recurso | Evolution API | Uazapi |
|---------|--------------|--------|
| **Criar Instância** | ✅ | ✅ |
| **Conectar (QR Code)** | ✅ | ✅ |
| **Conectar (Pareamento)** | ❌ | ✅ |
| **Desconectar** | ✅ | ✅ |
| **Status** | ✅ | ✅ |
| **Deletar** | ✅ | ✅ |
| **Configurações de Privacidade** | ⚠️ Limitado | ✅ Completo |
| **Alterar Nome do Perfil** | ❌ | ✅ |
| **Alterar Foto do Perfil** | ❌ | ✅ |
| **EvolutionBot** | ✅ | ❌ |
| **Chatbot via n8n** | ✅ | ✅ (n8n_session) |

---

## 🔍 Estrutura de Dados

### ConnectionInfo
```typescript
interface ConnectionInfo {
  id: string
  api_type: 'evolution' | 'uazapi'
  instance_name: string
  instance_token: string
  user_id: string
}
```

### Tabela `whatsapp_connections`
```sql
CREATE TABLE whatsapp_connections (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  connection_name varchar(255) NOT NULL,
  instance_name varchar(255) NOT NULL,
  instance_token text,
  api_type varchar(50) NOT NULL DEFAULT 'evolution',  -- NOVO CAMPO
  status varchar(50) DEFAULT 'disconnected',
  -- ... outros campos
  CONSTRAINT whatsapp_connections_api_type_check 
    CHECK (api_type IN ('evolution', 'uazapi'))
);
```

---

## 🛠️ Próximos Passos (Opcional)

### Funcionalidades Adicionais que Podem Ser Implementadas:

1. **Envio de Mensagens**
   - Implementar envio de mensagens via Uazapi
   - Suportar diferentes tipos (texto, imagem, áudio, etc.)

2. **Webhooks**
   - Configurar webhooks para receber eventos
   - Processar mensagens recebidas

3. **Configurações Avançadas**
   - Chatbot settings
   - Delay de mensagens
   - Auto-reconnect

4. **Dashboard de Métricas**
   - Mensagens enviadas/recebidas
   - Status de conexão em tempo real
   - Gráficos de uso

---

## 🐛 Troubleshooting

### Erro: "Failed to parse URL from /api/integrations"
**Causa:** Tentativa de fazer fetch com URL relativa no servidor  
**Solução:** ✅ Corrigido! Agora usa `uazapi-server.ts` que acessa o banco diretamente

### Erro: "Uazapi não está configurada"
**Solução:** Configure a integração em Admin → Configurações → Integrações

### Erro: "Erro ao criar instância na Uazapi"
**Soluções:**
1. Verifique se a URL do servidor está correta
2. Verifique se o API Key Global está correto
3. Verifique se o servidor Uazapi está online

### Conexões antigas não têm `api_type`
**Solução:** Execute o script SQL que adiciona o campo com valor padrão 'evolution'

---

## 📞 Suporte

Para dúvidas sobre:
- **Evolution API**: Consulte a documentação oficial
- **Uazapi**: Consulte `docs/uazapi-api-documentation` ou a regra do cursor

---

## ✅ Checklist de Implementação

- [x] Script SQL criado
- [x] Cliente Uazapi implementado
- [x] Camada de abstração criada
- [x] UI atualizada (seletor de API)
- [x] Endpoint de criação atualizado
- [x] Documentação criada
- [ ] Script SQL executado no banco
- [ ] Integração Uazapi configurada
- [ ] Testes realizados

---

**Versão:** 1.0.0  
**Data:** 2025-01-16  
**Autor:** Sistema IMPA AI

