"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Filter, 
  MoreVertical, 
  Users, 
  Clock, 
  MessageSquare, 
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckSquare,
  Square
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"

interface Session {
  id: string
  sessionId: string
  remoteJid: string
  pushName: string
  status: "opened" | "paused" | "closed" | "delete"
  awaitUser: boolean
  context: any
  type: string
  createdAt: string
  updatedAt: string
  instanceId: string
  parameters: any
  botId: string
}

interface Agent {
  id: string
  name: string
  evolution_bot_id: string
}

const SESSION_STATUS_COLORS = {
  opened: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800", 
  closed: "bg-red-100 text-red-800",
  delete: "bg-gray-100 text-gray-800"
}

export default function AdminAgentSessionsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const agentId = params.id as string

  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [massUpdateLoading, setMassUpdateLoading] = useState(false)
  
  // Filtros
  const [nameFilter, setNameFilter] = useState("")
  const [numberFilter, setNumberFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  
  // Paginação
  const [sessionsPerPage] = useState(9)
  const [sessionsDisplayed, setSessionsDisplayed] = useState(9)
  
  // Modais
  const [statusModal, setStatusModal] = useState<{open: boolean, sessionId: string, remoteJid: string}>({
    open: false,
    sessionId: "",
    remoteJid: ""
  })
  const [newStatus, setNewStatus] = useState<"opened" | "paused" | "closed" | "delete">("opened")
  const [massUpdateStatus, setMassUpdateStatus] = useState<"opened" | "paused" | "closed" | "delete">("opened")

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }
    // Verificar se é admin
    if (user.role !== "admin") {
      router.push("/dashboard")
      return
    }
    loadSessions()
  }, [agentId, router])

  useEffect(() => {
    applyFilters()
  }, [sessions, nameFilter, numberFilter, statusFilter, timeFilter])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const user = getCurrentUser()
      if (!user) return

      const response = await fetch(`/api/agents/${agentId}/sessions`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar sessões')
      }

      const data = await response.json()
      setSessions(data.data || [])
      setAgent(data.agent)
      addLog(`Carregadas ${data.data?.length || 0} sessões`)
    } catch (error) {
      console.error('Erro ao carregar sessões:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as sessões",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = sessions.filter(session => {
      const matchesName = !nameFilter || session.pushName?.toLowerCase().includes(nameFilter.toLowerCase())
      const matchesNumber = !numberFilter || session.remoteJid.includes(numberFilter)
      const matchesStatus = statusFilter === "all" || session.status === statusFilter
      
      let matchesTime = true
      if (timeFilter && timeFilter !== "all") {
        const diffMinutes = (Date.now() - new Date(session.updatedAt).getTime()) / 60000
        switch (timeFilter) {
          case "5":
            matchesTime = diffMinutes <= 5
            break
          case "10":
            matchesTime = diffMinutes <= 10
            break
          case "30":
            matchesTime = diffMinutes <= 30
            break
          case "60":
            matchesTime = diffMinutes <= 60
            break
          case ">60":
            matchesTime = diffMinutes > 60
            break
          case ">120":
            matchesTime = diffMinutes > 120
            break
        }
      }
      
      return matchesName && matchesNumber && matchesStatus && matchesTime
    })
    
    setFilteredSessions(filtered)
    setSessionsDisplayed(Math.min(sessionsPerPage, filtered.length))
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const changeSessionStatus = async (remoteJid: string, status: "opened" | "paused" | "closed" | "delete") => {
    try {
      const user = getCurrentUser()
      if (!user) return

      const response = await fetch(`/api/agents/${agentId}/sessions/change-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ remoteJid, status })
      })

      if (!response.ok) {
        throw new Error('Erro ao alterar status da sessão')
      }

      const data = await response.json()
      addLog(`Status da sessão ${remoteJid} alterado para ${status}`)
      toast({
        title: "Sucesso",
        description: `Status da sessão alterado para ${status}`,
      })
      
      // Recarregar sessões
      await loadSessions()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da sessão",
        variant: "destructive"
      })
    }
  }

  const handleMassStatusUpdate = async () => {
    if (selectedSessions.size === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma sessão",
        variant: "destructive"
      })
      return
    }

    try {
      setMassUpdateLoading(true)
      const sessionIds = Array.from(selectedSessions)
      
      addLog(`🔄 Iniciando atualização em massa de ${sessionIds.length} sessões para status: ${massUpdateStatus}`)

      const response = await fetch(`/api/agents/${agentId}/sessions/mass-update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          sessionIds, 
          status: massUpdateStatus 
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao processar operação em massa')
      }

      const data = await response.json()
      
      // Log detalhado dos resultados
      addLog(`✅ Operação concluída: ${data.data.successful} sucessos, ${data.data.failed} falhas`)
      
      if (data.data.failed > 0) {
        addLog(`⚠️ Algumas sessões falharam. Verifique os logs para mais detalhes.`)
        data.data.results.errors.forEach((error: any) => {
          addLog(`❌ ${error.remoteJid}: ${error.error}`)
        })
      }

      toast({
        title: "Operação Concluída",
        description: data.message,
        variant: data.data.failed > 0 ? "destructive" : "default"
      })
      
      // Limpar seleções
      setSelectedSessions(new Set())
      setSelectAll(false)
      
      // Recarregar sessões apenas uma vez
      await loadSessions()
      
    } catch (error) {
      console.error('Erro na operação em massa:', error)
      addLog(`❌ Erro na operação em massa: ${error}`)
      toast({
        title: "Erro",
        description: "Não foi possível processar a operação em massa",
        variant: "destructive"
      })
    } finally {
      setMassUpdateLoading(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(filteredSessions.slice(0, sessionsDisplayed).map(s => s.id)))
    }
    setSelectAll(!selectAll)
  }

  const toggleSelectSession = (sessionId: string) => {
    const newSelected = new Set(selectedSessions)
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId)
    } else {
      newSelected.add(sessionId)
    }
    setSelectedSessions(newSelected)
    setSelectAll(newSelected.size === Math.min(sessionsDisplayed, filteredSessions.length))
  }

  const getStatusBadge = (status: string) => {
    const colorClass = SESSION_STATUS_COLORS[status as keyof typeof SESSION_STATUS_COLORS] || "bg-gray-100 text-gray-800"
    return (
      <Badge className={`${colorClass} capitalize`}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const showMoreSessions = () => {
    setSessionsDisplayed(prev => Math.min(prev + sessionsPerPage, filteredSessions.length))
  }

  const showAllSessions = () => {
    setSessionsDisplayed(filteredSessions.length)
  }

  const showLessSessions = () => {
    setSessionsDisplayed(sessionsPerPage)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando sessões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/agents")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para Agentes</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sessões do Agente</h1>
            <p className="text-gray-600">{agent?.name}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSessions}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Filtrar por nome"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <Input
              placeholder="Filtrar por número"
              value={numberFilter}
              onChange={(e) => setNumberFilter(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tempos</SelectItem>
                <SelectItem value="5">Últimos 5 minutos</SelectItem>
                <SelectItem value="10">Últimos 10 minutos</SelectItem>
                <SelectItem value="30">Últimos 30 minutos</SelectItem>
                <SelectItem value="60">Últimos 60 minutos</SelectItem>
                <SelectItem value=">60">Mais de 60 minutos</SelectItem>
                <SelectItem value=">120">Mais de 2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ações em massa */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="flex items-center space-x-2"
              >
                {selectAll ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                <span>Selecionar Todas</span>
              </Button>
              <Select value={massUpdateStatus} onValueChange={(value: "opened" | "paused" | "closed" | "delete") => setMassUpdateStatus(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opened">Opened</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="default"
                size="sm"
                onClick={handleMassStatusUpdate}
                disabled={selectedSessions.size === 0 || massUpdateLoading}
              >
                {massUpdateLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Alterar Status das Selecionadas"
                )}
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              {selectedSessions.size} de {filteredSessions.length} sessões selecionadas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contador de sessões */}
      <div className="text-center">
        <Badge variant="secondary" className="text-lg py-2 px-4">
          <Users className="h-4 w-4 mr-2" />
          Total de Sessões: {filteredSessions.length}
        </Badge>
      </div>

      {/* Lista de sessões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.slice(0, sessionsDisplayed).map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Checkbox
                  checked={selectedSessions.has(session.id)}
                  onCheckedChange={() => toggleSelectSession(session.id)}
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ações da Sessão</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium">{session.pushName}</p>
                        <p className="text-sm text-gray-600">{session.remoteJid}</p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changeSessionStatus(session.remoteJid, "opened")}
                        >
                          Abrir Sessão
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changeSessionStatus(session.remoteJid, "paused")}
                        >
                          Pausar Sessão
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changeSessionStatus(session.remoteJid, "closed")}
                        >
                          Fechar Sessão
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changeSessionStatus(session.remoteJid, "delete")}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Deletar Sessão
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-lg">{session.pushName || "Sem Nome"}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Número:</strong> {session.remoteJid}</p>
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong> {getStatusBadge(session.status)}
                  </div>
                  <p><strong>Aguardando usuário:</strong> {session.awaitUser ? "Sim" : "Não"}</p>
                  <p><strong>Atualizado em:</strong> {formatDate(session.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botões de paginação */}
      {filteredSessions.length > sessionsPerPage && (
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={showMoreSessions}
            disabled={sessionsDisplayed >= filteredSessions.length}
          >
            Mostrar Mais
          </Button>
          <Button
            variant="outline"
            onClick={showAllSessions}
            disabled={sessionsDisplayed >= filteredSessions.length}
          >
            Mostrar Tudo
          </Button>
          <Button
            variant="outline"
            onClick={showLessSessions}
            disabled={sessionsDisplayed <= sessionsPerPage}
          >
            Mostrar Menos
          </Button>
        </div>
      )}

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Button
              variant="ghost"
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center justify-between w-full p-0"
            >
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Logs de Atividade</span>
              </div>
              {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        {showLogs && (
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum log ainda</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono mb-1 text-gray-700">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
} 