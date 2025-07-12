"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, RefreshCw, Users, Building2, Phone, Calendar } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface Lead {
  id: string
  whatsappConection: string
  remoteJid: string
  dia: number
  updated_at: string
  connection_name?: string
  user_id?: string
  empresa?: string
  nome_contato?: string
  status?: string
  phone_number?: string
}

interface Connection {
  id: string
  user_id: string
  connection_name: string
  status: string
  empresa?: string
}

export default function FollowupLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConnection, setSelectedConnection] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Carregar dados
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Buscar conexões WhatsApp
      const connectionsResponse = await fetch("/api/user/whatsapp-connections")
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json()
        setConnections(connectionsData.connections || [])
      }

      // Buscar leads reais da tabela lead_folow24hs
      const leadsResponse = await fetch("/api/admin/followup/leads")
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        setLeads(leadsData.leads || [])
        setFilteredLeads(leadsData.leads || [])
      } else {
        console.error("Erro ao buscar leads:", leadsResponse.statusText)
        setLeads([])
        setFilteredLeads([])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do follow-up",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar leads
  useEffect(() => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.remoteJid.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.connection_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.nome_contato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.empresa?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedConnection !== "all") {
      filtered = filtered.filter((lead) => lead.whatsappConection === selectedConnection)
    }

    if (selectedUser !== "all") {
      filtered = filtered.filter((lead) => lead.user_id === selectedUser)
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((lead) => lead.status === selectedStatus)
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, selectedConnection, selectedUser, selectedStatus])

  const uniqueUsers = Array.from(new Set(leads.map((l) => l.user_id).filter(Boolean)))
  const uniqueStatus = Array.from(new Set(leads.map((l) => l.status).filter((status): status is string => Boolean(status))))

  const handleLeadMove = async (leadId: string, newDay: number) => {
    try {
      const response = await fetch("/api/admin/followup/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: leadId,
          dia: newDay,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao mover lead")
      }

      // Atualizar localmente após sucesso
      setLeads((prev) =>
        prev.map((lead) => 
          lead.id === leadId 
            ? { ...lead, dia: newDay, updated_at: new Date().toISOString() } 
            : lead
        )
      )
      
      toast({
        title: "Sucesso",
        description: "Lead movido com sucesso",
      })
    } catch (error) {
      console.error("Erro ao mover lead:", error)
      toast({
        title: "Erro",
        description: "Falha ao mover lead",
        variant: "destructive",
      })
    }
  }

  const getStatsByDay = () => {
    const stats: Record<number, number> = {}
    filteredLeads.forEach((lead) => {
      stats[lead.dia] = (stats[lead.dia] || 0) + 1
    })
    return stats
  }

  const getLeadsByDay = (day: number) => {
    return filteredLeads.filter((lead) => lead.dia === day)
  }

  const dayStats = getStatsByDay()

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((day) => (
              <div key={day} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Controles e Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por contato, empresa, número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="space-y-6 mt-6">
                    <h2 className="text-lg font-semibold">Filtros</h2>
                    
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

                    <div>
                      <Label>Status</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os status</SelectItem>
                          {uniqueStatus.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((day) => (
          <Card key={day}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{dayStats[day] || 0}</div>
              <div className="text-sm text-gray-600">Dia {day}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((day) => {
          const dayLeads = getLeadsByDay(day)
          return (
            <Card key={day} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Dia {day}</span>
                  <Badge variant="secondary">{dayLeads.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayLeads.map((lead) => (
                  <Card key={lead.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={lead.status === "ativo" ? "default" : "secondary"}>
                          {lead.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(lead.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div>
                        <div className="font-medium text-sm">{lead.nome_contato || "Contato"}</div>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {lead.empresa || "Empresa"}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.remoteJid.split("@")[0]}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {lead.connection_name}
                        </div>
                      </div>

                      <div className="flex gap-1 pt-2">
                        {[1, 2, 3, 4, 5].map((targetDay) => (
                          <Button
                            key={targetDay}
                            size="sm"
                            variant={targetDay === day ? "default" : "outline"}
                            className="text-xs px-2 py-1 h-6"
                            onClick={() => handleLeadMove(lead.id, targetDay)}
                            disabled={targetDay === day}
                          >
                            {targetDay}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
                
                {dayLeads.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    Nenhum lead no dia {day}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 