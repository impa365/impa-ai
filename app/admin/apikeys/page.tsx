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
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ApiKey {
  id: string
  user_id: string
  name: string
  api_key: string
  description?: string
  is_active: boolean
  last_used_at?: string
  created_at: string
  permissions?: string[]
  rate_limit?: number
  user_profiles?: {
    full_name: string
    email: string
    role: string
  }
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

export default function AdminApiKeysPage() {
  const [user, setUser] = useState<any>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
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
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    if (currentUser.role !== "admin") {
      router.push("/dashboard")
      return
    }
    setUser(currentUser)
    loadData()
  }, [router])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchApiKeys(), fetchUsers()])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setMessage("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase URL or Anon Key is missing.")
        setMessage("Erro de configuração do Supabase.")
        return
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        db: { schema: "impaai" },
      })

      // Buscar API keys diretamente da tabela com JOIN
      const { data, error } = await supabase
        .from("user_api_keys")
        .select(`
          id,
          user_id,
          name,
          api_key,
          description,
          is_active,
          last_used_at,
          created_at,
          permissions,
          rate_limit,
          user_profiles!inner(
            full_name,
            email,
            role
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar API keys:", error)
        throw error
      }

      // Transformar os dados para o formato esperado
      const transformedKeys: ApiKey[] =
        data?.map((key: any) => ({
          ...key,
          user_profiles: key.user_profiles,
        })) || []

      setApiKeys(transformedKeys)
    } catch (error) {
      console.error("Erro ao buscar API keys:", error)
      setMessage("Erro ao carregar API keys. Verifique a configuração do banco de dados.")
    }
  }

  const fetchUsers = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase URL or Anon Key is missing.")
        setMessage("Erro de configuração do Supabase.")
        return
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        db: { schema: "impaai" },
      })

      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, role")
        .eq("status", "active")
        .order("full_name", { ascending: true })

      if (error) {
        console.error("Erro ao buscar usuários:", error)
        throw error
      }

      setUsers(data || [])
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      setMessage("Erro ao carregar usuários.")
    }
  }

  const generateApiKey = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = "impaai_"
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleCreateApiKey = async () => {
    if (!createForm.user_id || !createForm.name.trim()) {
      setMessage("Usuário e nome da chave são obrigatórios")
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase URL or Anon Key is missing.")
        setMessage("Erro de configuração do Supabase.")
        setSaving(false)
        return
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        db: { schema: "impaai" },
      })

      const newApiKey = generateApiKey()

      // Inserção direta na tabela (mais confiável que RPC)
      const { error } = await supabase.from("user_api_keys").insert({
        user_id: createForm.user_id,
        name: createForm.name.trim(),
        api_key: newApiKey,
        description: createForm.description.trim() || "API Key para integração com sistemas externos",
        permissions: ["read"],
        rate_limit: 100,
        is_active: true,
      })

      if (error) {
        console.error("Erro ao inserir API key:", error)
        throw error
      }

      await fetchApiKeys()
      setCreateModalOpen(false)
      setCreateForm({ user_id: "", name: "", description: "" })
      toast.success("API Key criada com sucesso!")
    } catch (error: any) {
      console.error("Erro ao criar API key:", error)
      const errorMessage = error.message?.includes("permission denied")
        ? "Erro de permissão. Verifique as configurações RLS."
        : error.message?.includes("duplicate key")
          ? "Já existe uma API key com este nome para este usuário."
          : "Erro ao criar API key: " + error.message
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteApiKey = async () => {
    if (!selectedApiKey) return

    setSaving(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase URL or Anon Key is missing.")
        setMessage("Erro de configuração do Supabase.")
        return
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        db: { schema: "impaai" },
      })

      const { error } = await supabase.from("user_api_keys").delete().eq("id", selectedApiKey.id)

      if (error) {
        console.error("Erro ao excluir API key:", error)
        throw error
      }

      await fetchApiKeys()
      setDeleteModalOpen(false)
      setSelectedApiKey(null)
      toast.success("API Key excluída com sucesso!")
    } catch (error: any) {
      console.error("Erro ao excluir API key:", error)
      setMessage("Erro ao excluir API key: " + error.message)
      toast.error("Erro ao excluir API key")
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
      toast.error("Erro ao copiar API Key")
    }
  }

  const maskApiKey = (apiKey: string): string => {
    if (apiKey.length <= 12) return apiKey
    return `${apiKey.substring(0, 12)}${"*".repeat(apiKey.length - 12)}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const generateCurlExamples = (apiKey: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"

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
    }
  }

  if (loading) {
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
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" />
          Nova API Key
        </Button>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert variant={message.includes("sucesso") ? "default" : "destructive"} className="mb-6">
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
          {apiKeys.length === 0 ? (
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
                    <TableHead>Permissões</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{apiKey.name}</div>
                          {apiKey.description && <div className="text-sm text-gray-500">{apiKey.description}</div>}
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
                                ? "border-purple-200 text-purple-700"
                                : "border-gray-200 text-gray-700"
                            }`}
                          >
                            {apiKey.user_profiles?.role === "admin" ? "Admin" : "Usuário"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {visibleKeys.has(apiKey.id) ? apiKey.api_key : maskApiKey(apiKey.api_key)}
                          </code>
                          <Button variant="ghost" size="sm" onClick={() => toggleApiKeyVisibility(apiKey.id)}>
                            {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.api_key)}>
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
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                          {apiKey.permissions?.join(", ") || "read"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {apiKey.last_used_at ? (
                            <div>
                              <div className="font-medium text-green-600">Usada</div>
                              <div className="text-gray-500">
                                {new Date(apiKey.last_used_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                                  ? "Recente"
                                  : "Há mais de 1 dia"}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-gray-500">Nunca usada</div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(apiKey.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setSelectedApiKeyForExamples(apiKey)
                              setExamplesModalOpen(true)
                            }}
                          >
                            <Code className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedApiKey(apiKey)
                              setDeleteModalOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
            <DialogDescription>Crie uma nova chave de API para um usuário específico</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">Usuário *</Label>
              <Select
                value={createForm.user_id}
                onValueChange={(value) => setCreateForm({ ...createForm, user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.full_name || user.email}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            user.role === "admin"
                              ? "border-purple-200 text-purple-700"
                              : "border-gray-200 text-gray-700"
                          }`}
                        >
                          {user.role === "admin" ? "Admin" : "Usuário"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
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
            <Button onClick={handleCreateApiKey} disabled={saving} className="gap-2">
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
              Copie e cole estes exemplos no n8n ou outras ferramentas de integração
            </DialogDescription>
          </DialogHeader>

          {selectedApiKeyForExamples && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">API Key Selecionada:</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-white px-2 py-1 rounded border flex-1">
                    {selectedApiKeyForExamples.name} - {maskApiKey(selectedApiKeyForExamples.api_key)}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedApiKeyForExamples.api_key)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="list-agents" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="list-agents">Listar Agentes</TabsTrigger>
                  <TabsTrigger value="get-agent">Obter Agente</TabsTrigger>
                  <TabsTrigger value="webhook">Webhook</TabsTrigger>
                </TabsList>

                <TabsContent value="list-agents" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Listar todos os agentes</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Retorna a lista de todos os agentes disponíveis para o usuário
                    </p>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateCurlExamples(selectedApiKeyForExamples.api_key).listAgents}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          copyToClipboard(generateCurlExamples(selectedApiKeyForExamples.api_key).listAgents)
                        }
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="get-agent" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Obter detalhes de um agente específico</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Retorna os detalhes completos de um agente específico. Substitua AGENT_ID pelo ID do agente
                      desejado.
                    </p>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateCurlExamples(selectedApiKeyForExamples.api_key).getAgent}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          copyToClipboard(generateCurlExamples(selectedApiKeyForExamples.api_key).getAgent)
                        }
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="webhook" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Enviar mensagem via webhook</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Envia uma mensagem através de um agente específico. Substitua os valores conforme necessário.
                    </p>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateCurlExamples(selectedApiKeyForExamples.api_key).webhook}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(generateCurlExamples(selectedApiKeyForExamples.api_key).webhook)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Dicas para uso no n8n:</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Use o nó "HTTP Request" para fazer as chamadas</li>
                      <li>• Configure o método HTTP correto (GET ou POST)</li>
                      <li>• Adicione o header "Authorization" com o valor "Bearer SUA_API_KEY"</li>
                      <li>• Para POST requests, configure o Content-Type como "application/json"</li>
                      <li>• Teste sempre em ambiente de desenvolvimento primeiro</li>
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
            <Button onClick={() => window.open("/docs/api", "_blank")} className="gap-2">
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
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Nome:</span>
                <span>{selectedApiKey.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Usuário:</span>
                <span>{selectedApiKey.user_profiles?.full_name || "Sem nome"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">API Key:</span>
                <code className="text-sm bg-white px-2 py-1 rounded">{maskApiKey(selectedApiKey.api_key)}</code>
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
