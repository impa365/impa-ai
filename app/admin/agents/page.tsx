"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Filter, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([])
  const [users, setUsers] = useState([])
  const [whatsappConnections, setWhatsappConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    user: "all",
    type: "all",
    voice_enabled: "all",
    calendar_enabled: "all",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar agentes com informações do usuário
      const { data: agentsData, error: agentsError } = await supabase
        .from("ai_agents")
        .select(`
          *,
          user_profiles!ai_agents_user_id_fkey(id, email, full_name),
          whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(connection_name, status)
        `)
        .order("created_at", { ascending: false })

      if (agentsError) throw agentsError
      setAgents(agentsData || [])

      // Buscar usuários para o filtro
      const { data: usersData, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, email, full_name")
        .order("full_name")

      if (usersError) throw usersError
      setUsers(usersData || [])

      // Buscar conexões WhatsApp para o modal
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .order("connection_name")

      if (connectionsError) throw connectionsError
      setWhatsappConnections(connectionsData || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      agent.user_profiles?.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      agent.user_profiles?.full_name.toLowerCase().includes(filters.search.toLowerCase())

    const matchesStatus = filters.status === "all" || agent.status === filters.status
    const matchesUser = filters.user === "all" || agent.user_id === filters.user
    const matchesType = filters.type === "all" || agent.type === filters.type
    const matchesVoice =
      filters.voice_enabled === "all" ||
      (filters.voice_enabled === "true" && agent.voice_response_enabled) ||
      (filters.voice_enabled === "false" && !agent.voice_response_enabled)
    const matchesCalendar =
      filters.calendar_enabled === "all" ||
      (filters.calendar_enabled === "true" && agent.calendar_integration) ||
      (filters.calendar_enabled === "false" && !agent.calendar_integration)

    return matchesSearch && matchesStatus && matchesUser && matchesType && matchesVoice && matchesCalendar
  })

  const handleCreateAgent = () => {
    setSelectedAgent(null)
    setShowAgentModal(true)
  }

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent)
    setShowAgentModal(true)
  }

  const handleDeleteAgent = async (agentId) => {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return

    try {
      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error("Erro ao excluir agente:", error)
      alert("Erro ao excluir agente")
    }
  }

  const handleToggleStatus = async (agent) => {
    try {
      const newStatus = agent.status === "active" ? "inactive" : "active"

      const { error } = await supabase.from("ai_agents").update({ status: newStatus }).eq("id", agent.id)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      alert("Erro ao alterar status do agente")
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Agentes IA</h1>
          <p className="text-gray-600">Administre todos os agentes do sistema</p>
        </div>
        <Button onClick={handleCreateAgent} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Criar Agente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6\
