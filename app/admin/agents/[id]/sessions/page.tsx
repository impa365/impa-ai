"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Pause, Play, Trash2, Search, MessageSquare, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

interface BotSession {
  sessionId: string
  remoteJid: string
  status: boolean
  ultimo_status: string
  criado_em: string
}

export default function AgentSessionsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const agentId = params.id as string

  const [agent, setAgent] = useState<any>(null)
  const [sessions, setSessions] = useState<BotSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Buscar dados do agente
      const agentResponse = await fetch(`/api/admin/agents/${agentId}`)
      if (!agentResponse.ok) {
        throw new Error("Erro ao buscar agente")
      }
      const agentData = await agentResponse.json()
      setAgent(agentData.agent)

      // Buscar sessões
      await fetchSessions()
    } catch (error: any) {
      console.error("❌ Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: error.message || "Falha ao carregar dados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/bot-sessions`)
      if (!response.ok) {
        throw new Error("Erro ao buscar sessões")
      }
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error: any) {
      console.error("❌ Erro ao buscar sessões:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar sessões",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (session: BotSession) => {
    try {
      const newStatus = !session.status
      const response = await fetch(`/api/bot-sessions/${session.sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar sessão")
      }

      toast({
        title: "Sucesso",
        description: newStatus ? "Bot reativado para este chat" : "Bot pausado para este chat",
      })

      fetchSessions()
    } catch (error: any) {
      console.error("❌ Erro ao atualizar sessão:", error)
      toast({
        title: "Erro",
        description: "Falha ao atualizar sessão",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/bot-sessions/${sessionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao deletar sessão")
      }

      toast({
        title: "Sucesso",
        description: "Sessão deletada com sucesso",
      })

      fetchSessions()
    } catch (error: any) {
      console.error("❌ Erro ao deletar sessão:", error)
      toast({
        title: "Erro",
        description: "Falha ao deletar sessão",
        variant: "destructive",
      })
    }
  }

  const formatPhone = (remoteJid: string) => {
    // Extrair apenas o número do JID (remover @s.whatsapp.net ou @g.us)
    const phone = remoteJid.split("@")[0]
    
    // Verificar se é grupo
    if (remoteJid.includes("@g.us")) {
      return `Grupo: ${phone}`
    }
    
    // Formatar telefone brasileiro (se tiver 13 dígitos: +55 XX XXXXX-XXXX)
    if (phone.length === 13 && phone.startsWith("55")) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`
    }
    
    // Formatar telefone brasileiro (se tiver 12 dígitos: +55 XX XXXX-XXXX)
    if (phone.length === 12 && phone.startsWith("55")) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 8)}-${phone.slice(8)}`
    }
    
    return phone
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return "agora"
      if (diffMins < 60) return `há ${diffMins} min`
      if (diffHours < 24) return `há ${diffHours}h`
      if (diffDays < 7) return `há ${diffDays}d`

      return date.toLocaleDateString("pt-BR")
    } catch {
      return dateString
    }
  }

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = formatPhone(session.remoteJid)
      .toLowerCase()
      .includes(searchFilter.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && session.status) ||
      (statusFilter === "paused" && !session.status)

    return matchesSearch && matchesStatus
  })

  const activeSessions = sessions.filter((s) => s.status).length
  const pausedSessions = sessions.filter((s) => !s.status).length

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessões do Bot</h1>
          <p className="text-gray-600">
            Agente: <span className="font-medium">{agent?.name || "Carregando..."}</span>
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Sessões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Chats Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Chats Pausados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pausedSessions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por número..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                className="flex-1"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
                className="flex-1"
              >
                Ativos
              </Button>
              <Button
                variant={statusFilter === "paused" ? "default" : "outline"}
                onClick={() => setStatusFilter("paused")}
                className="flex-1"
              >
                Pausados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Sessões */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões ({filteredSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div
                key={session.sessionId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      session.status ? "bg-green-100" : "bg-orange-100"
                    }`}
                  >
                    <MessageSquare
                      className={`w-5 h-5 ${
                        session.status ? "text-green-600" : "text-orange-600"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{formatPhone(session.remoteJid)}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Última atividade: {formatDate(session.ultimo_status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={session.status ? "default" : "secondary"} className={
                    session.status ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }>
                    {session.status ? "Ativo" : "Pausado"}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(session)}
                    title={session.status ? "Pausar bot" : "Reativar bot"}
                  >
                    {session.status ? (
                      <Pause className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Play className="w-4 h-4 text-green-600" />
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deletar sessão?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar esta sessão? O bot voltará a ser ativado
                          automaticamente caso o usuário envie uma nova mensagem.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteSession(session.sessionId)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Deletar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}

            {filteredSessions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma sessão encontrada</p>
                <p className="text-sm mt-2">
                  As sessões aparecerão aqui quando o bot responder conversas
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
