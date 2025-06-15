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
import { Plus, Key, Trash2, Copy, Eye, EyeOff, AlertCircle, CheckCircle, Users } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"

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

      // Buscar API keys com informações do usuário
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
        user_profiles!inner(
          full_name,
          email,
          role
        )
      `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Transformar os dados para o formato esperado
      const transformedKeys: ApiKey[] =
        data?.map((key: any) => ({
          ...key,
          user_profiles: key.user_profiles,
        })) || []

      setApiKeys(transformedKeys)
    } catch (error) {
      console.error("Erro ao buscar API keys:", error)
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

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
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
        return
      }
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        db: { schema: "impaai" },
      })
      const newApiKey = generateApiKey()

      const { error } = await supabase.from("user_api_keys").insert({
        user_id: createForm.user_id,
        name: createForm.name.trim(),
        api_key: newApiKey,
        description: createForm.description.trim() || "API Key para integração com sistemas externos",
        permissions: ["read"],
        rate_limit: 100,
        is_active: true,
        is_admin_key: false,
        access_scope: "user",
      })

      if (error) throw error

      await fetchApiKeys()
      setCreateModalOpen(false)
      setCreateForm({ user_id: "", name: "", description: "" })
      toast.success("API Key criada com sucesso!")
    } catch (error) {
      console.error("Erro ao criar API key:", error)
      setMessage("Erro ao criar API key")
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

      if (error) throw error

      await fetchApiKeys()
      setDeleteModalOpen(false)
      setSelectedApiKey(null)
      toast.success("API Key excluída com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir API key:", error)
      setMessage("Erro ao excluir API key")
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
                    <TableHead>Último Uso</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Ações</TableHead>
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
                        <div className="text-sm">
                          {apiKey.last_used_at ? (
                            <div>
                              <div>{formatDate(apiKey.last_used_at)}</div>
                              <div className="text-gray-500">
                                {new Date(apiKey.last_used_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                                  ? "Recente"
                                  : "Há mais de 1 dia"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Nunca usada</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(apiKey.created_at)}</div>
                      </TableCell>
                      <TableCell>
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
