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
import {
  Server,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Activity,
  Globe,
  Database,
  AlertCircle,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ServerConfig {
  id: string
  name: string
  type: "whatsapp_api" | "n8n_fluxos" | "n8n_api"
  url: string
  api_key?: string
  status: "online" | "offline" | "error"
  description?: string
  config: any
  created_at: string
  updated_at: string
}

export default function ServidoresPage() {
  const [user, setUser] = useState<any>(null)
  const [servers, setServers] = useState<ServerConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedServer, setSelectedServer] = useState<ServerConfig | null>(null)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    type: "whatsapp_api" as ServerConfig["type"],
    url: "",
    api_key: "",
    description: "",
  })

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    if (currentUser.role !== "super_admin") {
      router.push("/dashboard")
      return
    }
    setUser(currentUser)
    loadServers()
  }, [router])

  const loadServers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/servers")
      const data = await response.json()
      
      if (data.error) {
        setMessage(data.error)
        return
      }
      
      setServers(data.servers || [])
    } catch (error) {
      console.error("Erro ao carregar servidores:", error)
      setMessage("Erro ao carregar servidores")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(
        selectedServer ? `/api/super-admin/servers/${selectedServer.id}` : "/api/super-admin/servers",
        {
          method: selectedServer ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      if (data.error) {
        setMessage(data.error)
        return
      }

      setMessage(`Servidor ${selectedServer ? "atualizado" : "criado"} com sucesso!`)
      setModalOpen(false)
      loadServers()
    } catch (error) {
      console.error("Erro ao salvar servidor:", error)
      setMessage("Erro ao salvar servidor")
    }
    setTimeout(() => setMessage(""), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este servidor?")) return

    try {
      const response = await fetch(`/api/super-admin/servers/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.error) {
        setMessage(data.error)
        return
      }

      setMessage("Servidor deletado com sucesso!")
      loadServers()
    } catch (error) {
      console.error("Erro ao deletar servidor:", error)
      setMessage("Erro ao deletar servidor")
    }
    setTimeout(() => setMessage(""), 3000)
  }

  const getServerIcon = (type: string) => {
    switch (type) {
      case "whatsapp_api":
        return <Globe className="w-5 h-5" />
      case "n8n_fluxos":
        return <Activity className="w-5 h-5" />
      case "n8n_api":
        return <Server className="w-5 h-5" />
      default:
        return <Server className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-700"
      case "offline":
        return "bg-gray-100 text-gray-700"
      case "error":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Servidores e Integrações
              </h1>
              <p className="text-gray-600">
                Gerencie APIs de WhatsApp, Fluxos N8N e API N8N
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedServer(null)
                setFormData({
                  name: "",
                  type: "whatsapp_api",
                  url: "",
                  api_key: "",
                  description: "",
                })
                setModalOpen(true)
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Novo Servidor
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <Alert
            variant={message.includes("sucesso") ? "default" : "destructive"}
            className="mb-6"
          >
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Servers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <Card key={server.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    {getServerIcon(server.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{server.name}</CardTitle>
                    <Badge className={`${getStatusColor(server.status)} mt-1`}>
                      {server.status === "online" ? "Online" : server.status === "offline" ? "Offline" : "Erro"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Tipo:</span>{" "}
                    <span className="font-medium">{server.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">URL:</span>{" "}
                    <span className="font-medium text-xs truncate block">{server.url}</span>
                  </div>
                  {server.description && (
                    <div>
                      <span className="text-gray-500">Descrição:</span>{" "}
                      <span className="text-gray-700">{server.description}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedServer(server)
                      setFormData({
                        name: server.name,
                        type: server.type,
                        url: server.url,
                        api_key: server.api_key || "",
                        description: server.description || "",
                      })
                      setModalOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDelete(server.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {servers.length === 0 && !loading && (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum servidor configurado
                </h3>
                <p className="text-gray-600 mb-4">
                  Adicione servidores de WhatsApp, Fluxos N8N ou API N8N
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedServer ? "Editar Servidor" : "Novo Servidor"}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes do servidor ou integração
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do servidor"
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo *</Label>
                <select
                  id="type"
                  className="w-full p-2 border rounded-md"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                >
                  <option value="whatsapp_api">Servidor API WhatsApp (Evolution, Uazapi)</option>
                  <option value="n8n_fluxos">N8N - Fluxos (Webhooks/Agentes)</option>
                  <option value="n8n_api">N8N API (Gerenciamento)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://api.exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="api_key">API Key (opcional)</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Chave de API"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do servidor"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
