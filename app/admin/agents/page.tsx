"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Bot, Trash2, Power, PowerOff, Search, Users, Settings, Loader2, Info } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function AdminAgentsPage() {
  const { toast } = useToast()
  const [agents, setAgents] = useState([])
  const [filteredAgents, setFilteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [users, setUsers] = useState([])

  // Modais
  const [showLimitsModal, setShowLimitsModal] = useState(false)
  const [showResourcesModal, setShowResourcesModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Configurações
  const [userLimits, setUserLimits] = useState({})
  const [globalSettings, setGlobalSettings] = useState({})

  useEffect(() => {
    fetchAgents()
    fetchUsers()
    fetchGlobalSettings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [agents, searchTerm, statusFilter, typeFilter, userFilter])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("ai_agents")
        .select(`
          *,
          user_profiles!inner(id, email, full_name),
          whatsapp_connections!inner(connection_name, instance_name, status)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        setAgents(data)
        setFilteredAgents(data)
      }
    } catch (error) {
      console.error("Erro ao buscar agentes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agentes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("id, email, full_name").order("email")

      if (error) throw error
      if (data) setUsers(data)
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    }
  }

  const fetchGlobalSettings = async () => {
    try {
      const { data, error } = await supabase.from("global_agent_settings").select("setting_key, setting_value")

      if (error) throw error

      if (data) {
        const settings = {}
        data.forEach((item) => {
          settings[item.setting_key] = JSON.parse(item.setting_value)
        })
        setGlobalSettings(settings)
      }
    } catch (error) {
      console.error("Erro ao buscar configurações globais:", error)
    }
  }

  const fetchUserLimits = async (userId) => {
    try {
      const { data, error } = await supabase.from("user_agent_settings").select("*").eq("user_id", userId).single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      // Se não encontrou configurações, usar valores padrão
      const defaultLimits = {
        user_id: userId,
        max_agents: globalSettings.default_max_agents || 3,
        voice_response_enabled: true,
        calendar_integration_enabled: true,
        transcribe_audio_enabled: true,
        understand_images_enabled: true,
      }

      setUserLimits(data || defaultLimits)
    } catch (error) {
      console.error("Erro ao buscar limites do usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os limites do usuário",
        variant: "destructive",
      })
    }
  }

  const applyFilters = () => {
    let result = [...agents]

    // Aplicar filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (agent) =>
          agent.name.toLowerCase().includes(term) ||
          agent.description?.toLowerCase().includes(term) ||
          agent.user_profiles.email.toLowerCase().includes(term),
      )
    }

    // Aplicar filtro de status
    if (statusFilter !== "all") {
      result = result.filter((agent) => agent.status === statusFilter)
    }

    // Aplicar filtro de tipo/função
    if (typeFilter !== "all") {
      result = result.filter((agent) => agent.main_function === typeFilter)
    }

    // Aplicar filtro de usuário
    if (userFilter !== "all") {
      result = result.filter((agent) => agent.user_id === userFilter)
    }

    setFilteredAgents(result)
  }

  const handleToggleStatus = async (agent) => {
    try {
      setActionLoading(true)
      const newStatus = agent.status === "active" ? "inactive" : "active"

      const { error } = await supabase.from("ai_agents").update({ status: newStatus }).eq("id", agent.id)

      if (error) throw error

      // Atualizar localmente
      setAgents(agents.map((a) => (a.id === agent.id ? { ...a, status: newStatus } : a)))

      toast({
        title: "Sucesso",
        description: `Agente ${newStatus === "active" ? "ativado" : "desativado"} com sucesso`,
      })
    } catch (error) {
      console.error("Erro ao alterar status do agente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do agente",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteClick = (agent) => {
    setSelectedAgent(agent)
    setShowDeleteModal(true)
  }

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return

    try {
      setActionLoading(true)

      const { error } = await supabase.from("ai_agents").delete().eq("id", selectedAgent.id)

      if (error) throw error

      // Atualizar localmente
      setAgents(agents.filter((a) => a.id !== selectedAgent.id))
      setShowDeleteModal(false)
      setSelectedAgent(null)

      toast({
        title: "Sucesso",
        description: "Agente excluído com sucesso",
      })
    } catch (error) {
      console.error("Erro ao excluir agente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agente",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUserLimitsClick = (user) => {
    setSelectedUser(user)
    fetchUserLimits(user.id)
    setShowLimitsModal(true)
  }

  const saveUserLimits = async () => {
    try {
      setActionLoading(true)

      const { data, error } = await supabase.from("user_agent_settings").upsert(userLimits).select()

      if (error) throw error

      setShowLimitsModal(false)

      toast({
        title: "Sucesso",
        description: "Limites do usuário atualizados com sucesso",
      })
    } catch (error) {
      console.error("Erro ao salvar limites do usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar os limites do usuário",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const saveGlobalSettings = async () => {
    try {
      setActionLoading(true)

      // Atualizar cada configuração
      for (const [key, value] of Object.entries(globalSettings)) {
        await supabase
          .from("global_agent_settings")
          .update({ setting_value: JSON.stringify(value) })
          .eq("setting_key", key)
      }

      setShowResourcesModal(false)

      toast({
        title: "Sucesso",
        description: "Configurações globais atualizadas com sucesso",
      })
    } catch (error) {
      console.error("Erro ao salvar configurações globais:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações globais",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            Ativo
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Inativo
          </Badge>
        )
      case "training":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            Treinando
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
            Erro
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </Badge>
        )
    }
  }

  const getFunctionLabel = (func) => {
    const functions = {
      atendimento: "Atendimento ao Cliente",
      vendas: "Vendas",
      agendamento: "Agendamento",
      suporte: "Suporte Técnico",
      qualificacao: "Qualificação de Leads",
    }
    return functions[func] || func
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Agentes IA do Sistema</h1>
          <p className="text-muted-foreground">Gerencie todos os agentes criados pelos usuários</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResourcesModal(true)}
            className="flex items-center gap-2 text-foreground"
          >
            <Settings className="w-4 h-4" />
            Configurações Globais
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="search" className="text-foreground">
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nome, descrição ou email"
              className="pl-8 text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="statusFilter" className="text-foreground">
            Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="statusFilter" className="text-foreground">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="training">Treinando</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="typeFilter" className="text-foreground">
            Função
          </Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger id="typeFilter" className="text-foreground">
              <SelectValue placeholder="Filtrar por função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              <SelectItem value="atendimento">Atendimento ao Cliente</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
              <SelectItem value="agendamento">Agendamento</SelectItem>
              <SelectItem value="suporte">Suporte Técnico</SelectItem>
              <SelectItem value="qualificacao">Qualificação de Leads</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="userFilter" className="text-foreground">
            Usuário
          </Label>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger id="userFilter" className="text-foreground">
              <SelectValue placeholder="Filtrar por usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agents">Agentes ({filteredAgents.length})</TabsTrigger>
          <TabsTrigger value="users">Limites por Usuário</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Lista de Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAgents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum agente encontrado com os filtros selecionados
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{agent.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Função: {getFunctionLabel(agent.main_function)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {agent.user_profiles?.email || "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Conexão: {agent.whatsapp_connections?.connection_name || "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(agent.status)}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="text-foreground">
                            <Info className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(agent)}
                            disabled={actionLoading}
                            className="text-foreground"
                          >
                            {agent.status === "active" ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteClick(agent)}
                            disabled={actionLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Limites por Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700"
                  >
                    <div>
                      <div className="font-medium text-foreground">{user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.full_name || "Sem nome"}</div>
                    </div>
                    <Button variant="outline" onClick={() => handleUserLimitsClick(user)} className="text-foreground">
                      Configurar Limites
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir o agente{" "}
              <span className="font-medium text-foreground">{selectedAgent?.name}</span>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
              className="text-foreground"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgent} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir Agente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Limites do Usuário */}
      <Dialog open={showLimitsModal} onOpenChange={setShowLimitsModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Limites para {selectedUser?.email}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure os limites e permissões para este usuário
            </DialogDescription>
          </DialogHeader>

          {userLimits && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="maxAgents" className="text-foreground">
                  Limite de Agentes
                </Label>
                <Input
                  id="maxAgents"
                  type="number"
                  min="1"
                  value={userLimits.max_agents || 3}
                  onChange={(e) => setUserLimits({ ...userLimits, max_agents: Number.parseInt(e.target.value) || 1 })}
                  className="text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Padrão do sistema: {globalSettings.default_max_agents || 3} agentes
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Recursos Permitidos</h3>

                <div className="flex items-center justify-between">
                  <Label htmlFor="voiceResponse" className="text-foreground">
                    Resposta por Voz
                  </Label>
                  <Switch
                    id="voiceResponse"
                    checked={userLimits.voice_response_enabled !== false}
                    onCheckedChange={(checked) => setUserLimits({ ...userLimits, voice_response_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="calendarIntegration" className="text-foreground">
                    Integração de Agenda
                  </Label>
                  <Switch
                    id="calendarIntegration"
                    checked={userLimits.calendar_integration_enabled !== false}
                    onCheckedChange={(checked) =>
                      setUserLimits({ ...userLimits, calendar_integration_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="transcribeAudio" className="text-foreground">
                    Transcrição de Áudio
                  </Label>
                  <Switch
                    id="transcribeAudio"
                    checked={userLimits.transcribe_audio_enabled !== false}
                    onCheckedChange={(checked) => setUserLimits({ ...userLimits, transcribe_audio_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="understandImages" className="text-foreground">
                    Entendimento de Imagens
                  </Label>
                  <Switch
                    id="understandImages"
                    checked={userLimits.understand_images_enabled !== false}
                    onCheckedChange={(checked) => setUserLimits({ ...userLimits, understand_images_enabled: checked })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLimitsModal(false)}
              disabled={actionLoading}
              className="text-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveUserLimits}
              disabled={actionLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar Limites"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurações Globais */}
      <Dialog open={showResourcesModal} onOpenChange={setShowResourcesModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Configurações Globais</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure os recursos disponíveis para todos os usuários
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="defaultMaxAgents" className="text-foreground">
                Limite Padrão de Agentes
              </Label>
              <Input
                id="defaultMaxAgents"
                type="number"
                min="1"
                value={globalSettings.default_max_agents || 3}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    default_max_agents: Number.parseInt(e.target.value) || 1,
                  })
                }
                className="text-foreground"
              />
              <p className="text-xs text-muted-foreground">Este é o limite padrão para novos usuários</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Recursos Globais</h3>

              <div className="flex items-center justify-between">
                <Label htmlFor="voiceResponseGlobal" className="text-foreground">
                  Resposta por Voz
                </Label>
                <Switch
                  id="voiceResponseGlobal"
                  checked={globalSettings.voice_response_global_enabled !== false}
                  onCheckedChange={(checked) =>
                    setGlobalSettings({
                      ...globalSettings,
                      voice_response_global_enabled: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="calendarIntegrationGlobal" className="text-foreground">
                  Integração de Agenda
                </Label>
                <Switch
                  id="calendarIntegrationGlobal"
                  checked={globalSettings.calendar_integration_global_enabled !== false}
                  onCheckedChange={(checked) =>
                    setGlobalSettings({
                      ...globalSettings,
                      calendar_integration_global_enabled: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="transcribeAudioGlobal" className="text-foreground">
                  Transcrição de Áudio
                </Label>
                <Switch
                  id="transcribeAudioGlobal"
                  checked={globalSettings.transcribe_audio_global_enabled !== false}
                  onCheckedChange={(checked) =>
                    setGlobalSettings({
                      ...globalSettings,
                      transcribe_audio_global_enabled: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="understandImagesGlobal" className="text-foreground">
                  Entendimento de Imagens
                </Label>
                <Switch
                  id="understandImagesGlobal"
                  checked={globalSettings.understand_images_global_enabled !== false}
                  onCheckedChange={(checked) =>
                    setGlobalSettings({
                      ...globalSettings,
                      understand_images_global_enabled: checked,
                    })
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Provedores</h3>

              <div className="flex items-center justify-between">
                <Label htmlFor="fishAudioEnabled" className="text-foreground">
                  Fish Audio
                </Label>
                <Switch
                  id="fishAudioEnabled"
                  checked={globalSettings.fish_audio_enabled !== false}
                  onCheckedChange={(checked) =>
                    setGlobalSettings({
                      ...globalSettings,
                      fish_audio_enabled: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="elevenLabsEnabled" className="text-foreground">
                  Eleven Labs
                </Label>
                <Switch
                  id="elevenLabsEnabled"
                  checked={globalSettings.eleven_labs_enabled !== false}
                  onCheckedChange={(checked) =>
                    setGlobalSettings({
                      ...globalSettings,
                      eleven_labs_enabled: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="calComEnabled" className="text-foreground">
                  Cal.com
                </Label>
                <Switch
                  id="calComEnabled"
                  checked={globalSettings.cal_com_enabled !== false}
                  onCheckedChange={(checked) =>
                    setGlobalSettings({
                      ...globalSettings,
                      cal_com_enabled: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResourcesModal(false)}
              disabled={actionLoading}
              className="text-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveGlobalSettings}
              disabled={actionLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar Configurações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
