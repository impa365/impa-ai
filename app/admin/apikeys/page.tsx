"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Copy, Trash2, Key, Eye, EyeOff, Code, Shield, User } from "lucide-react"
import { toast } from "sonner"

interface ApiKey {
  id: string
  user_id: string
  api_key: string
  name: string
  description: string
  permissions: string[]
  rate_limit: number
  last_used_at: string | null
  is_active: boolean
  is_admin_key: boolean
  access_scope: string
  created_at: string
  user_profiles: {
    full_name: string
    email: string
  }
}

interface UserType {
  id: string
  email: string
  full_name: string
}

export default function AdminApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [curlModalOpen, setCurlModalOpen] = useState(false)
  const [selectedApiKey, setSelectedApiKey] = useState<string>("")
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyDescription, setNewKeyDescription] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [isAdminKey, setIsAdminKey] = useState(false)
  const [rateLimit, setRateLimit] = useState("100")
  const [creating, setCreating] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchApiKeys()
    fetchUsers()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/admin/api-keys")
      const data = await response.json()

      if (response.ok) {
        setApiKeys(data.apiKeys || [])
      } else {
        toast.error(data.error || "Erro ao carregar API keys")
      }
    } catch (error) {
      toast.error("Erro ao carregar API keys")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim() || !selectedUserId) {
      toast.error("Nome e usuário são obrigatórios")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newKeyName,
          description: newKeyDescription,
          userId: selectedUserId,
          isAdminKey,
          rateLimit: Number.parseInt(rateLimit),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("API Key criada com sucesso!")
        setCreateModalOpen(false)
        resetForm()
        fetchApiKeys()
      } else {
        toast.error(data.error || "Erro ao criar API key")
      }
    } catch (error) {
      toast.error("Erro ao criar API key")
    } finally {
      setCreating(false)
    }
  }

  const toggleApiKeyStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          isActive: !currentStatus,
        }),
      })

      if (response.ok) {
        toast.success(`API Key ${!currentStatus ? "ativada" : "desativada"} com sucesso!`)
        fetchApiKeys()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao atualizar API key")
      }
    } catch (error) {
      toast.error("Erro ao atualizar API key")
    }
  }

  const deleteApiKey = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/api-keys?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("API Key deletada com sucesso!")
        fetchApiKeys()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao deletar API key")
      }
    } catch (error) {
      toast.error("Erro ao deletar API key")
    }
  }

  const resetForm = () => {
    setNewKeyName("")
    setNewKeyDescription("")
    setSelectedUserId("")
    setIsAdminKey(false)
    setRateLimit("100")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado para a área de transferência!")
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId)
    } else {
      newVisibleKeys.add(keyId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const maskApiKey = (apiKey: string) => {
    if (apiKey.length <= 8) return apiKey
    return `${apiKey.substring(0, 8)}${"*".repeat(apiKey.length - 12)}${apiKey.substring(apiKey.length - 4)}`
  }

  const generateCurlExamples = (apiKey: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"

    return {
      getAllAgents: `curl -X GET "${baseUrl}/api/get-all/agent" \\
     -H "apikey: ${apiKey}"`,
      getSpecificAgent: `curl -X GET "${baseUrl}/api/get/agent/AGENT_ID_HERE" \\
     -H "apikey: ${apiKey}"`,
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar API Keys</h1>
          <p className="text-gray-600 mt-2">Gerencie todas as chaves de API do sistema</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={curlModalOpen} onOpenChange={setCurlModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Code className="w-4 h-4 mr-2" />
                Ver CURL
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Exemplos de CURL</DialogTitle>
                <DialogDescription>Exemplos de como usar as API keys para acessar os endpoints.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Selecione uma API Key:</Label>
                  <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma API key..." />
                    </SelectTrigger>
                    <SelectContent>
                      {apiKeys
                        .filter((key) => key.is_active)
                        .map((key) => (
                          <SelectItem key={key.id} value={key.api_key}>
                            {key.name} ({key.is_admin_key ? "Admin" : "User"}) - {key.user_profiles.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedApiKey && (
                  <Tabs defaultValue="get-all" className="w-full">
                    <TabsList>
                      <TabsTrigger value="get-all">Listar Agentes</TabsTrigger>
                      <TabsTrigger value="get-specific">Agente Específico</TabsTrigger>
                    </TabsList>
                    <TabsContent value="get-all" className="space-y-4">
                      <div>
                        <Label>GET /api/get-all/agent</Label>
                        <div className="mt-2 p-4 bg-gray-900 text-green-400 rounded font-mono text-sm overflow-x-auto">
                          <pre>{generateCurlExamples(selectedApiKey).getAllAgents}</pre>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => copyToClipboard(generateCurlExamples(selectedApiKey).getAllAgents)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="get-specific" className="space-y-4">
                      <div>
                        <Label>GET /api/get/agent/[id]</Label>
                        <div className="mt-2 p-4 bg-gray-900 text-green-400 rounded font-mono text-sm overflow-x-auto">
                          <pre>{generateCurlExamples(selectedApiKey).getSpecificAgent}</pre>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => copyToClipboard(generateCurlExamples(selectedApiKey).getSpecificAgent)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova API Key</DialogTitle>
                <DialogDescription>Crie uma nova chave de API para um usuário específico.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user">Usuário</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Ex: Integração N8N"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                    placeholder="Descreva o uso desta API key..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="admin-key" checked={isAdminKey} onCheckedChange={setIsAdminKey} />
                  <Label htmlFor="admin-key">API Key de Administrador</Label>
                </div>
                <div>
                  <Label htmlFor="rate-limit">Rate Limit (req/min)</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    placeholder="100"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createApiKey} disabled={creating}>
                  {creating ? "Criando..." : "Criar API Key"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma API Key encontrada</h3>
              <p className="text-gray-600 text-center mb-4">Crie a primeira API key para começar.</p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {apiKey.is_admin_key ? (
                        <Shield className="w-4 h-4 text-red-500" />
                      ) : (
                        <User className="w-4 h-4 text-blue-500" />
                      )}
                      {apiKey.name}
                      <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                        {apiKey.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                      <Badge variant={apiKey.is_admin_key ? "destructive" : "outline"}>
                        {apiKey.is_admin_key ? "Admin" : "User"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {apiKey.description}
                      <br />
                      <span className="text-xs">
                        Usuário: {apiKey.user_profiles.full_name} ({apiKey.user_profiles.email})
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Switch
                      checked={apiKey.is_active}
                      onCheckedChange={() => toggleApiKeyStatus(apiKey.id, apiKey.is_active)}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar esta API key? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteApiKey(apiKey.id)}>Deletar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">API Key</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                      {visibleKeys.has(apiKey.id) ? apiKey.api_key : maskApiKey(apiKey.api_key)}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => toggleKeyVisibility(apiKey.id)}>
                      {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey.api_key)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Permissões</Label>
                    <div className="flex gap-1 mt-1">
                      {apiKey.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Rate Limit</Label>
                    <p className="text-sm">{apiKey.rate_limit} req/min</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Criada em</Label>
                    <p className="text-sm">{new Date(apiKey.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Último uso</Label>
                    <p className="text-sm">
                      {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString("pt-BR") : "Nunca usado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
