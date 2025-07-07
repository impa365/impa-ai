"use client";
import React, { useState } from "react";

const endpoints = [
  {
    tag: "Leads",
    name: "Adicionar Lead",
    method: "POST",
    path: "/api/add-lead-follow",
    description: "Adiciona um novo lead ao follow up (sempre no dia 1).",
    auth: true,
    params: [
      { name: "remoteJid", type: "string", required: true, in: "body", desc: "Número ou JID do lead." },
      { name: "instance_name", type: "string", required: true, in: "body", desc: "Nome da instância/conexão." },
      { name: "instance_token", type: "string", required: true, in: "body", desc: "Token da instância/conexão." },
    ],
    curl: (baseUrl: string, apiKey: string) =>
      `curl -X POST "${baseUrl}/api/add-lead-follow" \
  -H "Authorization: Bearer ${apiKey}" \
  -H "Content-Type: application/json" \
  -d '{\n    "remoteJid": "557331912851@s.whatsapp.net",\n    "instance_name": "impaai_testeal_1866",\n    "instance_token": "A57F6969-79CD-4285-A783-798460BDFFC6"\n  }'`,
    response: `{
  "success": true,
  "lead": {
    "id": 2,
    "whatsappConection": "a8a6e1a4-223b-46af-81f8-8aa3a3f738fc",
    "remoteJid": "557331912851@s.whatsapp.net",
    "dia": 1,
    "updated_at": "2025-07-06T06:22:42.506+00:00"
  }
}`
  },
  {
    tag: "Leads",
    name: "Deletar Lead",
    method: "DELETE",
    path: "/api/deactivate-lead-follow",
    description: "Remove um lead do follow up (deleção real).",
    auth: true,
    params: [
      { name: "remoteJid", type: "string", required: true, in: "body", desc: "Número ou JID do lead." },
      { name: "instance_name", type: "string", required: true, in: "body", desc: "Nome da instância/conexão." },
      { name: "instance_token", type: "string", required: true, in: "body", desc: "Token da instância/conexão." },
    ],
    curl: (baseUrl: string, apiKey: string) =>
      `curl -X DELETE "${baseUrl}/api/deactivate-lead-follow" \
  -H "Authorization: Bearer ${apiKey}" \
  -H "Content-Type: application/json" \
  -d '{\n    "remoteJid": "557331912851@s.whatsapp.net",\n    "instance_name": "impaai_testeal_1866",\n    "instance_token": "A57F6969-79CD-4285-A783-798460BDFFC6"\n  }'`,
    response: `{
  "success": true,
  "message": "Lead deletado com sucesso",
  "leadId": 2
}`
  },
  {
    tag: "Leads",
    name: "Atualizar Lead",
    method: "PUT",
    path: "/api/update-lead-follow",
    description: "Atualiza o dia ou nome de um lead já existente.",
    auth: true,
    params: [
      { name: "remoteJid", type: "string", required: true, in: "body", desc: "Número ou JID do lead." },
      { name: "instance_name", type: "string", required: true, in: "body", desc: "Nome da instância/conexão." },
      { name: "dia", type: "number", required: true, in: "body", desc: "Novo dia do lead (1-30)." },
      { name: "name", type: "string", required: false, in: "body", desc: "Nome do lead (opcional)." },
    ],
    curl: (baseUrl: string, apiKey: string) =>
      `curl -X PUT "${baseUrl}/api/update-lead-follow" \
  -H "Authorization: Bearer ${apiKey}" \
  -H "Content-Type: application/json" \
  -d '{\n    "remoteJid": "557331912851@s.whatsapp.net",\n    "instance_name": "impaai_testeal_1866",\n    "dia": 2,\n    "name": "Nome do Lead (opcional)"\n  }'`,
    response: `{
  "success": true,
  "message": "Lead atualizado com sucesso",
  "data": {
    "id": 2,
    "whatsappConection": "a8a6e1a4-223b-46af-81f8-8aa3a3f738fc",
    "remoteJid": "557331912851@s.whatsapp.net",
    "dia": 2,
    "updated_at": "2025-07-06T06:22:42.506+00:00"
  }
}`
  },
  {
    tag: "Agentes",
    name: "Listar todos os agentes",
    method: "GET",
    path: "/api/get-all/agent",
    description: "Retorna a lista de todos os agentes disponíveis para o usuário autenticado.",
    auth: true,
    params: [],
    curl: (baseUrl: string, apiKey: string) =>
      `curl -X GET "${baseUrl}/api/get-all/agent" \
  -H "Authorization: Bearer ${apiKey}" \
  -H "Content-Type: application/json"`,
    response: `[
  {
    "id": "AGENT_ID",
    "name": "Nome do Agente",
    "status": "active"
  },
  // ...
]`
  },
  {
    tag: "Agentes",
    name: "Obter agente por ID",
    method: "GET",
    path: "/api/get/agent/AGENT_ID",
    description: "Retorna os detalhes de um agente específico pelo ID.",
    auth: true,
    params: [
      { name: "AGENT_ID", type: "string", required: true, in: "path", desc: "ID do agente." },
    ],
    curl: (baseUrl: string, apiKey: string) =>
      `curl -X GET "${baseUrl}/api/get/agent/AGENT_ID" \
  -H "Authorization: Bearer ${apiKey}" \
  -H "Content-Type: application/json"`,
    response: `{
  "id": "AGENT_ID",
  "name": "Nome do Agente",
  "status": "active",
  "created_at": "2025-07-06T06:22:42.506+00:00"
}`
  },
  {
    tag: "Conexões",
    name: "Obter conexão WhatsApp",
    method: "POST",
    path: "/api/get-connection-info",
    description: "Retorna todas as informações de uma conexão WhatsApp a partir do instance_name e instance_token.",
    auth: true,
    params: [
      { name: "instance_name", type: "string", required: true, in: "body", desc: "Nome da instância/conexão." },
      { name: "instance_token", type: "string", required: true, in: "body", desc: "Token da instância/conexão." },
    ],
    curl: (baseUrl: string, apiKey: string) =>
      `curl -X POST "${baseUrl}/api/get-connection-info" \
  -H "Authorization: Bearer ${apiKey}" \
  -H "Content-Type: application/json" \
  -d '{\n    "instance_name": "impaai_testeal_1866",\n    "instance_token": "A57F6969-79CD-4285-A783-798460BDFFC6"\n  }'`,
    response: `{
  "success": true,
  "connection": {
    "id": "a8a6e1a4-223b-46af-81f8-8aa3a3f738fc",
    "instance_name": "impaai_testeal_1866",
    "instance_token": "A57F6969-79CD-4285-A783-798460BDFFC6",
    "status": "connected",
    // ... outros campos da conexão ...
  }
}`
  },
  // ... Adicione outros endpoints aqui (Agentes, Webhook, etc)
];

const tags = Array.from(new Set(endpoints.map(e => e.tag)));

export default function ApiDocsPage() {
  const [selectedTag, setSelectedTag] = useState(tags[0]);
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints.find(e => e.tag === tags[0])!);
  const [apiKey, setApiKey] = useState("impaai_SUA_API_KEY_AQUI");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      {/* Sidebar de endpoints */}
      <aside className="w-64 border-r bg-gray-50 dark:bg-gray-800 p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Endpoints</h2>
        {tags.map(tag => (
          <div key={tag} className="mb-6">
            <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">{tag}</div>
            <ul className="space-y-1">
              {endpoints.filter(e => e.tag === tag).map(endpoint => (
                <li key={endpoint.name}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-blue-700 ${selectedEndpoint.name === endpoint.name ? "bg-blue-200 dark:bg-blue-600 text-blue-900 dark:text-white" : "text-gray-800 dark:text-gray-200"}`}
                    onClick={() => setSelectedEndpoint(endpoint)}
                  >
                    <span className="font-medium">{endpoint.method}</span> <span>{endpoint.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      {/* Painel principal */}
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Documentação da API</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">Guia de integração para desenvolvedores. Veja exemplos, parâmetros e respostas de cada endpoint.</p>
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Sua API Key</label>
          <input
            className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="impaai_SUA_API_KEY_AQUI"
            autoComplete="off"
          />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-100 font-bold text-xs">{selectedEndpoint.method}</span>
            <span className="font-mono text-lg text-gray-900 dark:text-gray-100">{selectedEndpoint.path}</span>
          </div>
          <div className="mb-4 text-gray-700 dark:text-gray-200">{selectedEndpoint.description}</div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Parâmetros</h3>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-left">Requerido</th>
                  <th className="p-2 text-left">Onde</th>
                  <th className="p-2 text-left">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {selectedEndpoint.params.map(param => (
                  <tr key={param.name}>
                    <td className="p-2 font-mono">{param.name}</td>
                    <td className="p-2">{param.type}</td>
                    <td className="p-2">{param.required ? "Sim" : "Não"}</td>
                    <td className="p-2">{param.in}</td>
                    <td className="p-2">{param.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Exemplo de cURL</h3>
            <div className="relative">
              <textarea
                className="w-full font-mono text-xs bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded p-2 pr-12"
                rows={selectedEndpoint.curl(baseUrl, apiKey).split("\n").length}
                value={selectedEndpoint.curl(baseUrl, apiKey)}
                readOnly
                onFocus={e => e.target.select()}
              />
              <button
                className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(selectedEndpoint.curl(baseUrl, apiKey))
                }}
              >Copiar</button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Exemplo de Resposta</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded p-2 text-xs overflow-x-auto">{selectedEndpoint.response}</pre>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900 rounded p-6 text-blue-900 dark:text-blue-100">
          <h3 className="font-bold mb-2">Autenticação</h3>
          <p className="mb-2">Inclua o header <span className="font-mono bg-blue-100 dark:bg-blue-700 px-1 rounded">Authorization: Bearer SUA_API_KEY</span> em todas as requisições.</p>
          <p className="mb-2">Use sempre HTTPS em produção. Nunca compartilhe sua API Key publicamente.</p>
          <p className="mb-2">Para dúvidas ou suporte, entre em contato com o administrador do sistema.</p>
        </div>
      </main>
    </div>
  );
} 