"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Key,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Users,
  Code,
  BookOpen,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth" // Client-side auth check
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Removido: import { getSupabaseServer } from "@/lib/supabase"

interface ApiKey {
  id: string
  user_id: string
  name: string
  api_key: string
  description?: string
  is_active: boolean
  last_used_at?: string
  created_at: string
  user_profiles?: {
    full_name: string
    email: string
    role: string
  }
}

interface UserProfile {
  // Renomeado de User para UserProfile para clareza
  id: string
  full_name: string
  email: string
  role: string
}

export default function AdminApiKeysPage() {
  const [currentUser, setCurrentUser] = useState<any>(null) // Renomeado de user para currentUser
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [usersForSelect, setUsersForSelect] = useState<UserProfile[]>([]) // Renomeado de users para usersForSelect
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("") // Para mensagens de erro/sucesso gerais
  const router = useRouter()

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null)
  const [examplesModalOpen, setExamplesModalOpen] = useState(false)
  const [selectedApiKeyForExamples, setSelectedApiKeyForExamples] = useState<ApiKey | null>(null)

  // Form states
  const [createForm, setCreateForm] = useState({
    user_id: "",
    name: "",
    description: "",
  })

  // Visibility states
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    const userSession = getCurrentUser() // Client-side check
    if (!userSession) {
      router.push("/")
      return
    }
    if (userSession.role !== "admin") {
      router.push("/dashboard")
      return
    }
    setCurrentUser(userSession)
    loadData()
  }, [router])

  const loadData = async () => {
    setLoading(true)
    setMessage("")
    try {
      await Promise.all([fetchApiKeys(), fetchUsersForSelect()])
    } catch (error) {
      console.error("Error loading data:", error) // Log de erro genérico
      setMessage("Erro ao carregar dados. Tente novamente.")
      toast.error("Erro ao carregar dados.")
    } finally {
      setLoading(false)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/admin/apikeys")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch API keys: ${response.statusText}`)
      }
      const data = await response.json()
      setApiKeys(data)
    } catch (error: any) {
      console.error("Error fetching API keys:", error.message) // Log de erro específico
      setMessage("Erro ao buscar API keys.")
      toast.error("Erro ao buscar API keys.")
    }
  }

  const fetchUsersForSelect = async () => {
    try {
      const response = await fetch("/api/admin/users-for-apikey")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch users: ${response.statusText}`)
      }
      const data = await response.json()
      setUsersForSelect(data)
    } catch (error: any) {
      console.error("Error fetching users for select:", error.message) // Log de erro específico
      setMessage("Erro ao buscar usuários.")
      toast.error("Erro ao buscar usuários.")
    }
  }

  // generateApiKey foi movido para o backend (API route)

  const handleCreateApiKey = async () => {
    if (!createForm.user_id || !createForm.name.trim()) {
      setMessage("Usuário e nome da chave são obrigatórios.")
      toast.error("Usuário e nome da chave são obrigatórios.")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/admin/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: createForm.user_id,
          name: createForm.name.trim(),
          description: createForm.description.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create API key: ${response.statusText}`)
      }

      await fetchApiKeys() // Recarrega a lista
      setCreateModalOpen(false)
      setCreateForm({ user_id: "", name: "", description: "" })
      toast.success("API Key criada com sucesso!")
    } catch (error: any) {
      console.error("Error creating API key:", error.message) // Log de erro específico
      setMessage(`Erro ao criar API key: ${error.message}`)
      toast.error(`Erro ao criar API key: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteApiKey = async () => {
    if (!selectedApiKey) return

    setSaving(true)
    setMessage("")
    try {
      const response = await fetch(`/api/admin/apikeys/${selectedApiKey.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete API key: ${response.statusText}`)
      }

      await fetchApiKeys() // Recarrega a lista
      setDeleteModalOpen(false)
      setSelectedApiKey(null)
      toast.success("API Key excluída com sucesso!")
    } catch (error: any) {
      console.error("Error deleting API key:", error.message) // Log de erro específico
      setMessage(`Erro ao excluir API key: ${error.message}`)
      toast.error(`Erro ao excluir API key: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const toggleApiKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId)
    } else {
      newVisibleKeys.add(keyId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("API Key copiada para a área de transferência!")
    } catch (error) {
      toast.error("Erro ao copiar API Key.")
    }
  }

  const maskApiKey = (apiKey: string): string => {
    if (!apiKey || apiKey.length <= 12) return apiKey || ""
    return `${apiKey.substring(0, 12)}${"*".repeat(apiKey.length - 12)}`
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Data inválida"
    }
  }

  const generateCurlExamples = (apiKey: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com" // Mantido como está

    return {
      listAgents: `curl -X GET "${baseUrl}/api/get-all/agent" \\
    -H "Authorization: Bearer ${apiKey}" \\
    -H "Content-Type: application/json"`,

      getAgent: `curl -X GET "${baseUrl}/api/get/agent/AGENT_ID" \\
    -H "Authorization: Bearer ${apiKey}" \\
    -H "Content-Type: application/json"`,

      webhook: `curl -X POST "${baseUrl}/api/agents/webhook" \\
    -H "Authorization: Bearer ${apiKey}" \\
    -H "Content-Type: application/json" \\
    -d '{
      "message": "Sua mensagem aqui",
      "phone": "5511999999999",
      "agent_id": "AGENT_ID"
    }'`,

      addLead: `curl -X POST "${baseUrl}/api/add-lead-follow" \\
    -H "Authorization: Bearer ${apiKey}" \\
    -H "Content-Type: application/json" \\
    -H "instance_name: INSTANCE_NAME" \\
    -H "user_id: USER_ID" \\
    -d '{
      "remoteJid": "5511999999999",
      "name": "Nome do Lead",
      "dia": "21/06/2025"
    }'`,

      updateLead: `curl -X POST "${baseUrl}/api/update-lead-follow" \\
    -H "Authorization: Bearer ${apiKey}" \\
    -H "Content-Type: application/json" \\
    -d '{
      "id": "LEAD_ID",
      "name": "Novo Nome",
      "markDayAsSent": 1
    }'`,

      listLeads: `curl -X GET "${baseUrl}/api/list-leads-follow?instance_name=INSTANCE_NAME&user_id=USER_ID" \\
    -H "Authorization: Bearer ${apiKey}" \\
    -H "Content-Type: application/json"`,

      deactivateLead: `curl -X POST "${baseUrl}/api/deactivate-lead-follow" \\
    -H "Authorization: Bearer ${apiKey}" \\
    -H "Content-Type: application/json" \\
    -d '{
      "id": "LEAD_ID"
    }'`,
    }
  }

  if (loading && !apiKeys.length && !usersForSelect.length) {
    // Condição de loading inicial
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando API Keys...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar API Keys</h1>
          <p className="text-gray-600">Controle as chaves de API de todos os usuários do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" className="gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Recarregar
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" />
            Nova API Key
          </Button>
        </div>
      </div>

      {/* Message Alert - Usar toast para a maioria das mensagens, este é para erros persistentes */}
      {message && !message.toLowerCase().includes("sucesso") && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total de API Keys</CardTitle>
            <Key className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{apiKeys.length}</div>
            <div className="text-sm text-blue-600 mt-2">Chaves cadastradas</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">API Keys Ativas</CardTitle>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{apiKeys.filter((key) => key.is_active).length}</div>
            <div className="text-sm text-green-600 mt-2">Em funcionamento</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Usuários com API</CardTitle>
            <Users className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{new Set(apiKeys.map((key) => key.user_id)).size}</div>
            <div className="text-sm text-purple-600 mt-2">Usuários únicos</div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Lista de API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !apiKeys.length ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando API Keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma API Key encontrada</h3>
              <p className="text-gray-600 mb-4">Crie a primeira API Key para começar a usar a API</p>
              <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar API Key
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Uso</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{apiKey.name}</div>
                          {apiKey.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate" title={apiKey.description}>
                              {apiKey.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{apiKey.user_profiles?.full_name || "Sem nome"}</div>
                          <div className="text-sm text-gray-500">{apiKey.user_profiles?.email}</div>
                          <Badge
                            variant="outline"
                            className={`text-xs mt-1 ${
                              apiKey.user_profiles?.role === "admin"
                                ? "border-purple-200 text-purple-700 bg-purple-50"
                                : "border-gray-200 text-gray-700 bg-gray-50"
                            }`}
                          >
                            {apiKey.user_profiles?.role === "admin" ? "Admin" : "Usuário"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {visibleKeys.has(apiKey.id) ? apiKey.api_key : maskApiKey(apiKey.api_key)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleApiKeyVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(apiKey.api_key)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={apiKey.is_active ? "default" : "secondary"}
                          className={apiKey.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
                        >
                          {apiKey.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {apiKey.last_used_at ? (
                            <div>
                              <div>{formatDate(apiKey.last_used_at)}</div>
                              {/* <div className="text-gray-500">
                                {new Date(apiKey.last_used_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                                  ? "Recente"
                                  : "Há mais de 1 dia"}
                              </div> */}
                            </div>
                          ) : (
                            <span className="text-gray-500">Nunca usada</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(apiKey.created_at)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600 hover:text-blue-700 h-8 w-8"
                          onClick={() => {
                            setSelectedApiKeyForExamples(apiKey)
                            setExamplesModalOpen(true)
                          }}
                          title="Ver exemplos de uso"
                        >
                          <Code className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 h-8 w-8"
                          onClick={() => {
                            setSelectedApiKey(apiKey)
                            setDeleteModalOpen(true)
                          }}
                          title="Excluir API Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Criar Nova API Key
            </DialogTitle>
            <DialogDescription>Crie uma nova chave de API para um usuário específico.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="userId">Usuário *</Label>
              <Select
                value={createForm.user_id}
                onValueChange={(value) => setCreateForm({ ...createForm, user_id: value })}
              >
                <SelectTrigger id="userId">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {usersForSelect.length === 0 && (
                    <SelectItem value="loading" disabled>
                      Carregando usuários...
                    </SelectItem>
                  )}
                  {usersForSelect.map(
                    (
                      userItem, // Renomeado user para userItem para evitar conflito
                    ) => (
                      <SelectItem key={userItem.id} value={userItem.id}>
                        <div className="flex items-center gap-2">
                          <span>{userItem.full_name || userItem.email}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              userItem.role === "admin"
                                ? "border-purple-200 text-purple-700 bg-purple-50"
                                : "border-gray-200 text-gray-700 bg-gray-50"
                            }`}
                          >
                            {userItem.role === "admin" ? "Admin" : "Usuário"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Nome da Chave *</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Ex: API Principal, Integração N8N"
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Descreva o uso desta API key..."
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateApiKey}
              disabled={saving || !createForm.user_id || !createForm.name.trim()}
              className="gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar API Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Examples Modal */}
      <Dialog open={examplesModalOpen} onOpenChange={setExamplesModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Exemplos de Uso da API
            </DialogTitle>
            <DialogDescription>
              Copie e cole estes exemplos no n8n ou outras ferramentas de integração.
            </DialogDescription>
          </DialogHeader>

          {selectedApiKeyForExamples && (
            <div className="space-y-6 py-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">API Key Selecionada:</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-white px-2 py-1 rounded border flex-1 truncate">
                    {selectedApiKeyForExamples.name} - {maskApiKey(selectedApiKeyForExamples.api_key)}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedApiKeyForExamples.api_key)}
                    className="bg-white hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="list-agents" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="list-agents">Listar Agentes</TabsTrigger>
                  <TabsTrigger value="get-agent">Obter Agente</TabsTrigger>
                  <TabsTrigger value="webhook">Webhook</TabsTrigger>
                  <TabsTrigger value="add-lead">Adicionar Lead</TabsTrigger>
                  <TabsTrigger value="update-lead">Atualizar Lead</TabsTrigger>
                  <TabsTrigger value="list-leads">Listar Leads</TabsTrigger>
                </TabsList>

                <TabsContent value="list-agents" className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">Listar todos os agentes</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Retorna a lista de todos os agentes disponíveis para o usuário.
                    </p>
                    <div className="relative group">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateCurlExamples(selectedApiKeyForExamples.api_key).listAgents}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white"
                        onClick={() =>
                          copyToClipboard(generateCurlExamples(selectedApiKeyForExamples.api_key).listAgents)
                        }
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copiar
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="get-agent" className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">Obter detalhes de um agente específico</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Retorna os detalhes completos de um agente específico. Substitua AGENT_ID pelo ID do agente
                      desejado.
                    </p>
                    <div className="relative group">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateCurlExamples(selectedApiKeyForExamples.api_key).getAgent}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white"
                        onClick={() =>
                          copyToClipboard(generateCurlExamples(selectedApiKeyForExamples.api_key).getAgent)
                        }
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copiar
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="webhook" className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">Enviar mensagem via webhook</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Envia uma mensagem através de um agente específico. Substitua os valores conforme necessário.
                    </p>
                    <div className="relative group">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateCurlExamples(selectedApiKeyForExamples.api_key).webhook}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white"
                        onClick={() => copyToClipboard(generateCurlExamples(selectedApiKeyForExamples.api_key).webhook)}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copiar
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="add-lead" className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">Adicionar lead ao follow-up</h4>
                    <p className="text-sm text-gray-600 mb-3">Adiciona um novo lead ao processo de follow-up 24hs.</p>
                    <div className="relative group">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateCurlExamples(selectedApiKeyForExamples.api_key).addLead}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white"
                        onClick={() => copyToClipboard(generateCurlExamples(selectedApiKeyForExamples.api_key).addLead)}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copiar
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="update-lead" className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">Atualizar lead do follow-up</h4>
                    <p className="text-sm text-gray-600 mb-3">Atualiza dados do lead ou marca um dia como enviado.</p>
                    <div className="relative group">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateCurlExamples(selectedApiKeyForExamples.api_key).updateLead}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white"
                        onClick={() =>
                          copyToClipboard(generateCurlExamples(selectedApiKeyForExamples.api_key).updateLead)
                        }
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copiar
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="list-leads" className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-medium mb-2">Listar leads do follow-up</h4>
                    <p className="text-sm text-gray-600 mb-3">Lista todos os leads de uma instância específica.</p>
                    <div className="relative group">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateCurlExamples(selectedApiKeyForExamples.api_key).listLeads}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white"
                        onClick={() =>
                          copyToClipboard(generateCurlExamples(selectedApiKeyForExamples.api_key).listLeads)
                        }
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copiar
                      </Button>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-3">
                      <h5 className="font-medium text-blue-900 mb-1">Endpoint adicional:</h5>
                      <p className="text-sm text-blue-800 mb-2">Para desativar um lead:</p>
                      <code className="text-xs bg-white px-2 py-1 rounded border text-blue-700">
                        {generateCurlExamples(selectedApiKeyForExamples.api_key).deactivateLead}
                      </code>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Dicas para uso no n8n:</h4>
                    <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                      <li>Use o nó "HTTP Request" para fazer as chamadas.</li>
                      <li>Configure o método HTTP correto (GET ou POST).</li>
                      <li>Adicione o header "Authorization" com o valor "Bearer SUA_API_KEY".</li>
                      <li>Para POST requests, configure o Content-Type como "application/json".</li>
                      <li>Teste sempre em ambiente de desenvolvimento primeiro.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setExamplesModalOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => window.open("https://docs.impa.ai/api-reference", "_blank")}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {" "}
              {/* Atualizar URL da documentação se necessário */}
              <ExternalLink className="w-4 h-4" />
              Ver Documentação Completa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete API Key Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Excluir API Key
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A API key será permanentemente removida e todas as integrações que a
              utilizam irão parar de funcionar.
            </DialogDescription>
          </DialogHeader>

          {selectedApiKey && (
            <div className="bg-red-50 p-4 rounded-lg space-y-2 my-4 border border-red-200">
              <div className="flex justify-between">
                <span className="font-medium text-red-900">Nome:</span>
                <span className="text-red-700">{selectedApiKey.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-red-900">Usuário:</span>
                <span className="text-red-700">{selectedApiKey.user_profiles?.full_name || "Sem nome"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-red-900">API Key:</span>
                <code className="text-sm bg-white px-2 py-1 rounded border border-red-200 text-red-700">
                  {maskApiKey(selectedApiKey.api_key)}
                </code>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteApiKey} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir API Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
