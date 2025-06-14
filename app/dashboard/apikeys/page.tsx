"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Copy, Trash2, Key, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface ApiKey {
  id: string
  api_key: string
  name: string
  description: string
  permissions: string[]
  rate_limit: number
  last_used_at: string | null
  is_active: boolean
  created_at: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyDescription, setNewKeyDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/user/api-keys")
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

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newKeyName,
          description: newKeyDescription,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("API Key criada com sucesso!")
        setCreateModalOpen(false)
        setNewKeyName("")
        setNewKeyDescription("")
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

  const deleteApiKey = async (id: string) => {
    try {
      const response = await fetch(`/api/user/api-keys?id=${id}`, {
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
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-gray-600 mt-2">Gerencie suas chaves de API para integração com sistemas externos</p>
        </div>
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
              <DialogDescription>
                Crie uma nova chave de API para acessar seus agentes via integração externa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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

      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma API Key encontrada</h3>
              <p className="text-gray-600 text-center mb-4">
                Crie sua primeira API key para começar a integrar com sistemas externos.
              </p>
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
                      {apiKey.name}
                      <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                        {apiKey.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{apiKey.description}</CardDescription>
                  </div>
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

      {apiKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Como usar suas API Keys</CardTitle>
            <CardDescription>
              Use suas API keys para acessar os endpoints da API e integrar com sistemas externos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Endpoints disponíveis:</Label>
              <div className="mt-2 space-y-2">
                <div className="p-3 bg-gray-50 rounded">
                  <code className="text-sm">GET /api/get-all/agent</code>
                  <p className="text-xs text-gray-600 mt-1">Lista todos os seus agentes</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <code className="text-sm">GET /api/get/agent/[id]</code>
                  <p className="text-xs text-gray-600 mt-1">Obtém detalhes de um agente específico</p>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Exemplo de uso:</Label>
              <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
                {`curl -X GET "https://seu-dominio.com/api/get-all/agent" \\
     -H "apikey: sua_api_key_aqui"`}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
