"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, MessageSquare, Video, Mic, FileText, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/components/ui/use-toast"

interface Message {
  id: string
  whatsapp_conenections_id: string
  tentativa_dia: number
  tipo_mensagem: "text" | "video" | "audio" | "image"
  mensagem: string | null
  link: string | null
  connection_name?: string
}

interface Connection {
  id: string
  user_id: string
  connection_name: string
  status: string
}

export default function FollowupMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<string>("all")
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formData, setFormData] = useState<{
    whatsapp_conenections_id: string
    tentativa_dia: number
    tipo_mensagem: "text" | "video" | "audio" | "image"
    mensagem: string
    link: string
  }>({
    whatsapp_conenections_id: "",
    tentativa_dia: 1,
    tipo_mensagem: "text",
    mensagem: "",
    link: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Buscar conexões
      const connectionsResponse = await fetch("/api/user/whatsapp-connections")
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json()
        setConnections(connectionsData.connections || [])
      }

      // Buscar mensagens
      const messagesResponse = await fetch("/api/admin/followup/messages")
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        setMessages(messagesData.messages || [])
        setFilteredMessages(messagesData.messages || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar mensagens",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar mensagens por conexão
  useEffect(() => {
    if (selectedConnection === "all") {
      setFilteredMessages(messages)
    } else {
      setFilteredMessages(messages.filter((m) => m.whatsapp_conenections_id === selectedConnection))
    }
  }, [messages, selectedConnection])

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileText className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Mic className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case "text":
        return "Texto"
      case "video":
        return "Vídeo"
      case "audio":
        return "Áudio"
      case "image":
        return "Imagem"
      default:
        return type
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = editingMessage ? "PUT" : "POST"
      const body = editingMessage 
        ? { id: editingMessage.id, ...formData }
        : formData

      const response = await fetch("/api/admin/followup/messages", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar mensagem")
      }

      toast({
        title: "Sucesso",
        description: editingMessage ? "Mensagem atualizada!" : "Mensagem criada!",
      })

      // Reset form
      setFormData({
        whatsapp_conenections_id: "",
        tentativa_dia: 1,
        tipo_mensagem: "text",
        mensagem: "",
        link: "",
      })
      setEditingMessage(null)
      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar mensagem",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (message: Message) => {
    setEditingMessage(message)
    setFormData({
      whatsapp_conenections_id: message.whatsapp_conenections_id,
      tentativa_dia: message.tentativa_dia,
      tipo_mensagem: message.tipo_mensagem,
      mensagem: message.mensagem || "",
      link: message.link || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta mensagem?")) return

    try {
      const response = await fetch(`/api/admin/followup/messages?id=${messageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao deletar mensagem")
      }

      toast({
        title: "Sucesso",
        description: "Mensagem deletada!",
      })

      loadData()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao deletar mensagem",
        variant: "destructive",
      })
    }
  }

  const handleNewMessage = () => {
    setEditingMessage(null)
    setFormData({
      whatsapp_conenections_id: "",
      tentativa_dia: 1,
      tipo_mensagem: "text",
      mensagem: "",
      link: "",
    })
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    
                    <div>
                      <Label>Conexão WhatsApp</Label>
                      <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as conexões" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as conexões</SelectItem>
                          {connections.map((conn) => (
                            <SelectItem key={conn.id} value={conn.id}>
                              {conn.connection_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <Button onClick={handleNewMessage} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Mensagem
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mensagens */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma mensagem encontrada</h3>
              <p className="text-gray-600 mb-4">
                {selectedConnection === "all" 
                  ? "Comece criando sua primeira mensagem de follow-up"
                  : "Nenhuma mensagem para a conexão selecionada"
                }
              </p>
              <Button onClick={handleNewMessage}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Mensagem
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getMessageIcon(message.tipo_mensagem)}
                        <Badge variant="outline">{getMessageTypeLabel(message.tipo_mensagem)}</Badge>
                      </div>
                      <Badge variant="secondary">Dia {message.tentativa_dia}</Badge>
                      <span className="text-sm text-gray-600">
                        {connections.find(c => c.id === message.whatsapp_conenections_id)?.connection_name || "Conexão"}
                      </span>
                    </div>

                    {message.mensagem && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.mensagem}</p>
                      </div>
                    )}

                    {message.link && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Link:</span>
                          <a
                            href={message.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {message.link}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(message)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(message.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMessage ? "Editar Mensagem" : "Nova Mensagem"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="connection">Conexão WhatsApp *</Label>
                <Select
                  value={formData.whatsapp_conenections_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, whatsapp_conenections_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conexão" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        {conn.connection_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="day">Dia da Tentativa *</Label>
                <Select
                  value={formData.tentativa_dia.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tentativa_dia: Number(value) }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="type">Tipo de Mensagem *</Label>
              <Select
                value={formData.tipo_mensagem}
                onValueChange={(value: "text" | "video" | "audio" | "image") => 
                  setFormData(prev => ({ ...prev, tipo_mensagem: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="audio">Áudio</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={formData.mensagem}
                onChange={(e) => setFormData(prev => ({ ...prev, mensagem: e.target.value }))}
                placeholder="Digite a mensagem..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="link">Link (URL)</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://exemplo.com/arquivo.mp4"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingMessage ? "Atualizar" : "Criar"} Mensagem
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 