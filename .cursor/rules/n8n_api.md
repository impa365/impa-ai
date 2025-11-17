# API n8n - Documentação de Referência

## Informações Gerais

### Base URL
```
https://your-instance.app.n8n.cloud/api/v1
```
Para instâncias self-hosted: `https://your-domain.com/api/v1`

### Autenticação
Todas as requisições requerem autenticação via API Key no header:
```
X-N8N-API-KEY: YOUR_SECRET_TOKEN
```

### Formato de Dados
- **Content-Type**: `application/json`
- **Accept**: `application/json`

---

## Endpoints de Workflows

### 1. Criar Workflow
**POST** `/workflows`

Cria um novo workflow na instância n8n.

**Request Body:**
```json
{
  "name": "Nome do Workflow",
  "nodes": [
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300]
    }
  ],
  "connections": {},
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "tags": []
}
```

**Exemplo cURL:**
```bash
curl https://your-instance.app.n8n.cloud/api/v1/workflows \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN' \
  --data '{
    "name": "My Workflow",
    "nodes": [],
    "connections": {},
    "active": false
  }'
```

**Response (200):**
```json
{
  "id": "1",
  "name": "My Workflow",
  "active": false,
  "createdAt": "2025-11-15T10:00:00.000Z",
  "updatedAt": "2025-11-15T10:00:00.000Z",
  "nodes": [],
  "connections": {},
  "settings": {},
  "tags": []
}
```

---

### 2. Listar Workflows
**GET** `/workflows`

Retorna todos os workflows da instância.

**Query Parameters:**
- `limit` (number, max: 250, default: 100) - Número máximo de itens
- `cursor` (string) - Cursor para paginação
- `active` (boolean) - Filtrar por status ativo/inativo

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/workflows?limit=100' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Workflow 1",
      "active": true,
      "createdAt": "2025-11-15T10:00:00.000Z",
      "updatedAt": "2025-11-15T10:00:00.000Z",
      "tags": []
    }
  ],
  "nextCursor": "eyJsYXN0SWQiOiIxMCIsImxhc3RWYWx1ZSI6IjEwIn0="
}
```

---

### 3. Consultar Workflow por ID
**GET** `/workflows/{id}`

Retorna os detalhes de um workflow específico.

**Path Parameters:**
- `id` (string, required) - ID do workflow

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/workflows/1' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

**Response (200):**
```json
{
  "id": "1",
  "name": "My Workflow",
  "active": true,
  "nodes": [
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300]
    }
  ],
  "connections": {},
  "settings": {},
  "staticData": null,
  "tags": [],
  "createdAt": "2025-11-15T10:00:00.000Z",
  "updatedAt": "2025-11-15T10:00:00.000Z"
}
```

---

### 4. Atualizar Workflow
**PUT** `/workflows/{id}`

Atualiza um workflow existente.

**Path Parameters:**
- `id` (string, required) - ID do workflow

**Request Body:**
```json
{
  "name": "Updated Workflow Name",
  "nodes": [...],
  "connections": {...},
  "active": true,
  "settings": {...}
}
```

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/workflows/1' \
  --request PUT \
  --header 'Content-Type: application/json' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN' \
  --data '{
    "name": "Updated Workflow Name",
    "nodes": [],
    "connections": {}
  }'
```

**Response (200):**
```json
{
  "id": "1",
  "name": "Updated Workflow Name",
  "active": false,
  "updatedAt": "2025-11-15T11:00:00.000Z"
}
```

---

### 5. Deletar Workflow
**DELETE** `/workflows/{id}`

Remove um workflow da instância.

**Path Parameters:**
- `id` (string, required) - ID do workflow

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/workflows/1' \
  --request DELETE \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

**Response (204):**
```
No Content
```

---

### 6. Ativar Workflow
**POST** `/workflows/{id}/activate`

Ativa um workflow para execução automática.

**Path Parameters:**
- `id` (string, required) - ID do workflow

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/workflows/1/activate' \
  --request POST \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

**Response (200):**
```json
{
  "id": "1",
  "active": true
}
```

---

### 7. Desativar Workflow
**POST** `/workflows/{id}/deactivate`

Desativa um workflow.

**Path Parameters:**
- `id` (string, required) - ID do workflow

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/workflows/1/deactivate' \
  --request POST \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

**Response (200):**
```json
{
  "id": "1",
  "active": false
}
```

---

### 8. Transferir Workflow
**PUT** `/workflows/{id}/transfer`

Transfere a propriedade de um workflow para outro projeto.

**Path Parameters:**
- `id` (string, required) - ID do workflow

**Request Body:**
```json
{
  "destinationProjectId": "project-id-here"
}
```

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/workflows/1/transfer' \
  --request PUT \
  --header 'Content-Type: application/json' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN' \
  --data '{
    "destinationProjectId": "abc123"
  }'
```

---

### 9. Obter Tags do Workflow
**GET** `/workflows/{id}/tags`

Retorna as tags associadas a um workflow.

**Path Parameters:**
- `id` (string, required) - ID do workflow

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/workflows/1/tags' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

**Response (200):**
```json
[
  {
    "id": "1",
    "name": "production",
    "createdAt": "2025-11-15T10:00:00.000Z",
    "updatedAt": "2025-11-15T10:00:00.000Z"
  }
]
```

---

### 10. Atualizar Tags do Workflow
**PUT** `/workflows/{id}/tags`

Atualiza as tags de um workflow.

**Path Parameters:**
- `id` (string, required) - ID do workflow

**Request Body:**
```json
{
  "tags": ["tag-id-1", "tag-id-2"]
}
```

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/workflows/1/tags' \
  --request PUT \
  --header 'Content-Type: application/json' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN' \
  --data '{
    "tags": ["1", "2"]
  }'
```

---

## Endpoints de Execuções

### 1. Listar Execuções
**GET** `/executions`

Lista todas as execuções de workflows.

**Query Parameters:**
- `limit` (number, max: 250, default: 100)
- `cursor` (string) - Para paginação
- `workflowId` (string) - Filtrar por workflow específico
- `status` (string) - Filtrar por status: `success`, `error`, `running`, `waiting`

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/executions?workflowId=1&status=success' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

---

### 2. Consultar Execução por ID
**GET** `/executions/{id}`

Retorna detalhes de uma execução específica.

**Path Parameters:**
- `id` (string, required) - ID da execução

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/executions/123' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

---

### 3. Deletar Execução
**DELETE** `/executions/{id}`

Remove uma execução.

**Path Parameters:**
- `id` (string, required) - ID da execução

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/executions/123' \
  --request DELETE \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

---

### 4. Reexecutar Workflow
**POST** `/executions/{id}/retry`

Reexecuta um workflow a partir de uma execução anterior.

**Path Parameters:**
- `id` (string, required) - ID da execução

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/executions/123/retry' \
  --request POST \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

---

## Endpoints de Credenciais

### 1. Criar Credencial
**POST** `/credentials`

Cria uma nova credencial.

**Request Body:**
```json
{
  "name": "My API Key",
  "type": "httpHeaderAuth",
  "data": {
    "name": "Authorization",
    "value": "Bearer token123"
  }
}
```

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/credentials' \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN' \
  --data '{
    "name": "My API Key",
    "type": "httpHeaderAuth",
    "data": {...}
  }'
```

---

### 2. Deletar Credencial
**DELETE** `/credentials/{id}`

Remove uma credencial.

**Path Parameters:**
- `id` (string, required) - ID da credencial

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/credentials/1' \
  --request DELETE \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

---

### 3. Obter Schema de Credencial
**GET** `/credentials/schema/{credentialTypeName}`

Retorna o schema de um tipo de credencial.

**Path Parameters:**
- `credentialTypeName` (string, required) - Nome do tipo de credencial

**Exemplo cURL:**
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/credentials/schema/httpHeaderAuth' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

---

## Códigos de Resposta HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Operação bem-sucedida |
| 201 | Recurso criado com sucesso |
| 204 | Operação bem-sucedida sem conteúdo de retorno |
| 400 | Requisição inválida |
| 401 | Não autorizado (API key inválida ou ausente) |
| 403 | Proibido (sem permissão para acessar o recurso) |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## Paginação

A API do n8n usa paginação baseada em cursor para endpoints que retornam listas.

**Parâmetros:**
- `limit`: Número máximo de itens (default: 100, max: 250)
- `cursor`: String retornada no campo `nextCursor` da resposta anterior

**Exemplo de resposta paginada:**
```json
{
  "data": [...],
  "nextCursor": "MTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDA"
}
```

Para obter a próxima página:
```bash
curl 'https://your-instance.app.n8n.cloud/api/v1/workflows?cursor=MTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDA' \
  --header 'X-N8N-API-KEY: YOUR_SECRET_TOKEN'
```

---

## Exemplos de Uso em Node.js

### Instalação
```bash
npm install axios
```

### Exemplo: Criar Workflow
```javascript
const axios = require('axios');

const apiKey = 'YOUR_SECRET_TOKEN';
const baseURL = 'https://your-instance.app.n8n.cloud/api/v1';

async function createWorkflow() {
  try {
    const response = await axios.post(
      `${baseURL}/workflows`,
      {
        name: 'Meu Novo Workflow',
        nodes: [],
        connections: {},
        active: false
      },
      {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Workflow criado:', response.data);
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

createWorkflow();
```

### Exemplo: Listar Workflows
```javascript
async function listWorkflows() {
  try {
    const response = await axios.get(
      `${baseURL}/workflows?limit=10`,
      {
        headers: {
          'X-N8N-API-KEY': apiKey
        }
      }
    );
    console.log('Workflows:', response.data);
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

listWorkflows();
```

### Exemplo: Atualizar Workflow
```javascript
async function updateWorkflow(workflowId) {
  try {
    const response = await axios.put(
      `${baseURL}/workflows/${workflowId}`,
      {
        name: 'Workflow Atualizado',
        active: true
      },
      {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Workflow atualizado:', response.data);
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

updateWorkflow('1');
```

---

## Exemplos de Uso em Python

### Instalação
```bash
pip install requests
```

### Exemplo: Criar Workflow
```python
import requests
import json

api_key = 'YOUR_SECRET_TOKEN'
base_url = 'https://your-instance.app.n8n.cloud/api/v1'

def create_workflow():
    headers = {
        'X-N8N-API-KEY': api_key,
        'Content-Type': 'application/json'
    }
    
    data = {
        'name': 'Meu Novo Workflow',
        'nodes': [],
        'connections': {},
        'active': False
    }
    
    response = requests.post(
        f'{base_url}/workflows',
        headers=headers,
        json=data
    )
    
    if response.status_code == 200:
        print('Workflow criado:', response.json())
    else:
        print('Erro:', response.status_code, response.text)

create_workflow()
```

### Exemplo: Listar Workflows
```python
def list_workflows():
    headers = {
        'X-N8N-API-KEY': api_key
    }
    
    response = requests.get(
        f'{base_url}/workflows?limit=10',
        headers=headers
    )
    
    if response.status_code == 200:
        workflows = response.json()
        print(f"Total de workflows: {len(workflows['data'])}")
        for workflow in workflows['data']:
            print(f"- {workflow['name']} (ID: {workflow['id']}, Ativo: {workflow['active']})")
    else:
        print('Erro:', response.status_code, response.text)

list_workflows()
```

---

## Boas Práticas

### 1. Segurança da API Key
- **NUNCA** exponha sua API key em código público
- Use variáveis de ambiente para armazenar a API key
- Rotacione as API keys periodicamente

### 2. Rate Limiting
- Implemente retry logic com backoff exponencial
- Respeite os limites de taxa da API
- Use paginação para grandes conjuntos de dados

### 3. Tratamento de Erros
```javascript
async function safeApiCall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.response) {
      // Erro da API
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else if (error.request) {
      // Sem resposta do servidor
      console.error('Sem resposta do servidor');
    } else {
      // Erro na configuração da requisição
      console.error('Erro:', error.message);
    }
    throw error;
  }
}
```

### 4. Validação de Dados
- Sempre valide os dados antes de enviar para a API
- Verifique se todos os campos obrigatórios estão presentes
- Use TypeScript ou validação de schema quando possível

---

## Links Úteis

- **Documentação Oficial**: https://docs.n8n.io/api/api-reference/
- **Playground da API**: https://docs.n8n.io/api/using-api-playground/
- **Autenticação**: https://docs.n8n.io/api/authentication/
- **Paginação**: https://docs.n8n.io/api/pagination/
- **GitHub n8n**: https://github.com/n8n-io/n8n
- **Comunidade**: https://community.n8n.io/

---

## Suporte

Para questões e suporte:
- **Fórum da Comunidade**: https://community.n8n.io/
- **GitHub Issues**: https://github.com/n8n-io/n8n/issues
- **Email**: hello@n8n.io

---

**Última Atualização**: Novembro 2025  
**Versão da API**: v1.1.1
