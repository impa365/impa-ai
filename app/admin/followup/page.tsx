"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, RefreshCw, Users, Building2, Phone, Calendar, GripVertical } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

// @dnd-kit imports
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  rectIntersection,
  pointerWithin,
} from '@dnd-kit/core'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

// Componente para cada lead individual (draggable e droppable)
const DraggableLead = memo(function DraggableLead({ lead, onMove }: { lead: Lead; onMove: (leadId: string, newDay: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    },
    transition: {
      duration: 150, // Transição mais rápida
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  })

  // Também funciona como drop zone
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition, // Sem transição durante drag
    opacity: isDragging ? 0.8 : 1,
    pointerEvents: isDragging ? ('none' as const) : ('auto' as const),
    zIndex: isDragging ? 1000 : 'auto',
  }

  // Combinar refs
  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node)
    setDropRef(node)
  }

  return (
    <div className="relative">
      <Card 
        ref={combinedRef} 
        style={style}
        {...attributes}
        {...listeners}
        className={`p-3 transition-all duration-200 cursor-grab active:cursor-grabbing select-none relative ${
          isDragging 
            ? 'shadow-2xl ring-2 ring-blue-500 bg-blue-50 rotate-1 scale-105 z-50 transform-gpu' 
            : isOver
            ? 'ring-2 ring-green-400 bg-green-50 shadow-lg transform-gpu'
            : 'hover:shadow-lg hover:scale-[1.01] hover:bg-gray-50 transform-gpu'
        }`}
        title="Arraste este card para mover entre os dias"
      >
        <div className="space-y-2 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <Badge variant={lead.status === "ativo" ? "default" : "secondary"}>
                {lead.status}
              </Badge>
            </div>
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

          {/* Indicador de drop sobre lead */}
          {isOver && (
            <div className="text-xs text-green-600 font-medium text-center bg-green-100 py-1 rounded">
              💚 Solte aqui para mover para o Dia {lead.dia}
            </div>
          )}

          {/* Botões para mover entre dias (fallback) */}
          <div className="flex gap-1 pt-2 pointer-events-auto">
            {[1, 2, 3, 4, 5].map((targetDay) => (
              <Button
                key={targetDay}
                size="sm"
                variant={targetDay === lead.dia ? "default" : "outline"}
                className="text-xs px-2 py-1 h-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onMove(lead.id, targetDay)
                }}
                disabled={targetDay === lead.dia}
              >
                {targetDay}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
})

// Componente para área de drop de cada dia
const DroppableDay = memo(function DroppableDay({ 
  day, 
  leads, 
  onMove
}: { 
  day: number; 
  leads: Lead[]; 
  onMove: (leadId: string, newDay: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day}`,
    data: {
      type: 'day',
      day,
    }
  })

  return (
    <div className="relative h-full">
      {/* Container principal que recebe drops */}
      <div
        ref={setNodeRef}
        className={`absolute inset-0 z-0 transition-all duration-300 rounded-lg ${
          isOver 
            ? 'bg-gradient-to-b from-blue-50 to-blue-100 ring-2 ring-blue-400 ring-offset-1 shadow-xl' 
            : 'bg-transparent'
        }`}
      />

      {/* Overlay visual para feedback */}
      {isOver && (
        <div className="absolute inset-0 bg-blue-100/70 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center pointer-events-none z-20">
          <div className="bg-white/90 px-4 py-2 rounded-lg shadow-lg">
            <div className="text-blue-600 font-semibold text-center">
              📥 Solte aqui para mover para o Dia {day}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da coluna */}
      <Card className="h-full relative z-10 min-h-[500px] pointer-events-none">
        <CardHeader className="pb-3 pointer-events-auto">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Dia {day}</span>
            <Badge variant="secondary">{leads.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-6 pointer-events-auto">
          {/* Lista de leads - cada um individualmente pode ser clicado */}
          <div className="space-y-3 relative z-0">
            {leads.map((lead) => (
              <div key={lead.id} className="relative z-0">
                <DraggableLead lead={lead} onMove={onMove} />
              </div>
            ))}
          </div>
          
          {leads.length === 0 && (
            <div className={`text-center text-sm py-12 border-2 border-dashed rounded-lg transition-all duration-300 pointer-events-none ${
              isOver 
                ? 'border-blue-400 bg-blue-50 text-blue-700' 
                : 'border-gray-200 text-gray-500'
            }`}>
              <div className="space-y-2">
                <div className="text-2xl">📭</div>
                <div>Nenhum lead no dia {day}</div>
                <div className="text-xs text-gray-400">Arraste leads para esta coluna</div>
              </div>
            </div>
          )}
          
          {/* Área de expansão para garantir drop em toda coluna */}
          <div className="min-h-[100px] pointer-events-none"></div>
        </CardContent>
      </Card>
    </div>
  )
})

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
  
  // Estados para drag and drop
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduzido para resposta mais rápida
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  )

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

  const handleLeadMove = useCallback(async (leadId: string, newDay: number) => {
    // Buscar o lead atual para backup em caso de erro
    const originalLead = leads.find(l => l.id === leadId)
    if (!originalLead || originalLead.dia === newDay) return

    // 1. ATUALIZAÇÃO OTIMÍSTICA - atualizar UI imediatamente
    setLeads((prev) =>
      prev.map((lead) => 
        lead.id === leadId 
          ? { ...lead, dia: newDay, updated_at: new Date().toISOString() } 
          : lead
      )
    )

    try {
      // 2. Fazer a chamada da API em background
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

      // 3. Confirmar sucesso com toast discreto
      toast({
        title: "✅ Movido",
        description: `Lead movido para o Dia ${newDay}`,
      })
    } catch (error) {
      console.error("Erro ao mover lead:", error)
      
      // 4. REVERTER em caso de erro - voltar para o estado original
      setLeads((prev) =>
        prev.map((lead) => 
          lead.id === leadId 
            ? originalLead
            : lead
        )
      )
      
      toast({
        title: "❌ Erro",
        description: "Falha ao mover lead - movimento revertido",
        variant: "destructive",
      })
    }
  }, [leads, setLeads])

  // Handlers para drag and drop
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    // Pequeno delay para permitir animação suave
    document.body.style.cursor = 'grabbing'
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    // Limpar cursor
    document.body.style.cursor = ''
    
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string
    
    let targetDay: number | null = null

    // Se foi solto diretamente em um dia
    if (overId.startsWith('day-')) {
      targetDay = parseInt(overId.replace('day-', ''))
    }
    // Se foi solto em outro lead, encontrar o dia do lead de destino
    else {
      const targetLead = filteredLeads.find(l => l.id === overId)
      if (targetLead) {
        targetDay = targetLead.dia
      }
    }

    // Limpar o activeId IMEDIATAMENTE para evitar snapback
    setActiveId(null)

    // Fazer o movimento após limpar o estado de drag
    if (targetDay !== null) {
      const lead = filteredLeads.find(l => l.id === activeId)
      
      if (lead && lead.dia !== targetDay) {
        // Pequeno timeout para permitir animação completa
        setTimeout(() => {
          handleLeadMove(activeId, targetDay)
        }, 50)
      }
    }
  }, [filteredLeads, handleLeadMove])

  // Função customizada de detecção de colisão
  const customCollisionDetection = (args: any) => {
    // Primeiro, tenta detectar colisão com as áreas de drop dos dias
    const pointerIntersections = pointerWithin(args)
    const dayIntersections = pointerIntersections.filter((intersection: any) => 
      intersection.id.toString().startsWith('day-')
    )
    
    if (dayIntersections.length > 0) {
      return dayIntersections
    }

    // Se não encontrou dia, tenta detectar colisão com leads
    const rectIntersections = rectIntersection(args)
    return rectIntersections
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
  const activeLead = activeId ? filteredLeads.find(lead => lead.id === activeId) : null

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
      {/* CSS para melhorar performance das animações */}
      <style jsx>{`
        .dnd-container * {
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }
      `}</style>
      
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

      {/* Instrução de uso */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm text-blue-700">
            <div className="text-2xl">🎯</div>
            <div>
              <div className="font-semibold text-blue-800">Drag & Drop Avançado:</div>
              <div>
                <strong>📱 Arrastar:</strong> Clique e arraste qualquer card inteiro para mover
                <br />
                <strong>📍 Soltar:</strong> Solte em <em>qualquer lugar</em> - coluna vazia, em cima de outros cards ou nas bordas
                <br />
                <strong>💚 Visual:</strong> Verde = soltar no mesmo dia | Azul = soltar em dia diferente
                <br />
                <strong>🔘 Alternativa:</strong> Use os botões numerados dentro dos cards
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board com Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 dnd-container">
          {[1, 2, 3, 4, 5].map((day) => {
            const dayLeads = getLeadsByDay(day)
            
            return (
              <DroppableDay
                key={day}
                day={day}
                leads={dayLeads}
                onMove={handleLeadMove}
              />
            )
          })}
        </div>

        {/* Overlay para mostrar o item sendo arrastado */}
        <DragOverlay>
          {activeLead ? (
            <Card className="p-3 shadow-lg ring-2 ring-blue-500 bg-white">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={activeLead.status === "ativo" ? "default" : "secondary"}>
                    {activeLead.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(activeLead.updated_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div>
                  <div className="font-medium text-sm">{activeLead.nome_contato || "Contato"}</div>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {activeLead.empresa || "Empresa"}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {activeLead.remoteJid.split("@")[0]}
                  </div>
                </div>
              </div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
} 