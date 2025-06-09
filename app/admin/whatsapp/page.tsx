"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Edit,
  Trash2,
  QrCode,
  Smartphone,
  PowerOff,
  UserPlus,
  Plus,
  Search,
  Filter,
  X,
  RefreshCw,
  Info,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import WhatsAppQRModal from "@/components/whatsapp-qr-modal"
import WhatsAppSettingsModal from "@/components/whatsapp-settings-modal"
import WhatsAppInfoModal from "@/components/whatsapp-info-modal"
import { syncInstanceStatus, disconnectInstance } from "@/lib/whatsapp-settings-api"
import { getCurrentUser } from "@/lib/auth"
import AdminWhatsAppConnectionModal from "@/components/admin-whatsapp-connection-modal"
import TransferConnectionModal from "@/components/transfer-connection-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteEvolutionInstance } from "@/lib/whatsapp-api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminWhatsAppPage() {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<any>(null)
  const [saveMessage, setSaveMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Estados para o modal de criação
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Estados para o modal de transferência
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  // Estados para confirmação de exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [connectionToDelete, setConnectionToDelete] = useState<any>(null)

  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setCurrentUser(user)
    }
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const { data } = await supabase
        .from("whatsapp_connections")
        .select(`
          *,
          user_profiles!whatsapp_connections_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })

      if (data) setConnections(data)
    } catch (error) {
      console.error("Erro ao buscar conexões:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar conexões baseado nos critérios de busca
  const filteredConnections = useMemo(() => {
    return connections.filter((connection) => {
      // Filtro por termo de busca (nome do usuário, email, nome da conexão, instância)
      const searchMatch =
        searchTerm === "" ||
        connection.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connection.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connection.connection_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connection.instance_name?.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtro por status
      const statusMatch = statusFilter === "all" || connection.status === statusFilter

      return searchMatch && statusMatch
    })
  }, [connections, searchTerm, statusFilter])

  // Função para sincronizar status de uma conexão específica
  const syncConnection = useCallback(
    async (connectionId: string) => {
      if (syncing) return

      setSyncing(true)
      try {
        const result = await syncInstanceStatus(connectionId)
        if (result.success) {
          await fetchConnections()
          console.log("Sincronização realizada:", result)
        } else {
          console.error("Erro na sincronização:", result.error)
        }
      } catch (error) {
        console.error("Erro ao sincronizar:", error)
      } finally {
        setSyncing(false)
      }
    },
    [syncing],
  )

  // Função de sincronização manual melhorada
  const handleManualSync = async () => {
    if (syncing || !connections.length) return

    setSyncing(true)
    try {
      console.log(`[MANUAL-SYNC] Iniciando sincronização de ${connections.length} conexões`)

      // Sincronizar conexões uma por vez para evitar sobrecarga
      for (const connection of connections) {
        try {
          console.log(`[MANUAL-SYNC] Sincronizando: ${connection.instance_name}`)
          await syncInstanceStatus(connection.id)
          // Pequena pausa entre sincronizações
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`[MANUAL-SYNC] Erro na conexão ${connection.instance_name}:`, error)
          // Continuar com as outras conexões mesmo se uma falhar
        }
      }

      // Recarregar conexões após sincronização
      await fetchConnections()
      setSaveMessage("Sincronização concluída!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error("Erro na sincronização manual:", error)
      setSaveMessage("Erro na sincronização")
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setSyncing(false)
    }
  }

  // Remover sincronização automática silenciosa que estava causando erro
  // useEffect(() => {
  //   if (connections.length > 0) {
  //     // Sincronização silenciosa removida para evitar erros
  //   }
  // }, [connections.length])

  // Quando o modal QR é aberto, sincronizar a conexão selecionada
  useEffect(() => {
    if (qrModalOpen && selectedConnection) {
      syncConnection(selectedConnection.id)
    }
  }, [qrModalOpen, selectedConnection, syncConnection])

  // Quando o modal de configurações é aberto, sincronizar a conexão selecionada
  useEffect(() => {
    if (settingsModalOpen && selectedConnection) {
      syncConnection(selectedConnection.id)
    }
  }, [settingsModalOpen, selectedConnection, syncConnection])

  const handleDisconnectConnection = async (connection: any) => {
    try {
      const result = await disconnectInstance(connection.instance_name)

      if (result.success) {
        // Recarregar conexões após desconectar
        await fetchConnections()
        setSaveMessage("Conexão desconectada com sucesso!")
        setTimeout(() => setSaveMessage(""), 3000)
      } else {
        setSaveMessage("Erro ao desconectar conexão")
        setTimeout(() => setSaveMessage(""), 3000)
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error)
      setSaveMessage("Erro ao desconectar conexão")
      setTimeout(() => setSaveMessage(""), 3000)
    }
  }

  const handleDeleteConnection = (connection: any) => {
    setConnectionToDelete(connection)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteConnection = async () => {
    if (!connectionToDelete) return

    try {
      // Deletar da Evolution API
      await deleteEvolutionInstance(connectionToDelete.instance_name)

      // Deletar do banco
      const { error } = await supabase.from("whatsapp_connections").delete().eq("id", connectionToDelete.id)

      if (error) throw error

      await fetchConnections()
      setDeleteConfirmOpen(false)
      setConnectionToDelete(null)
      setSaveMessage("Conexão excluída com sucesso!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error("Erro ao deletar conexão:", error)
      setSaveMessage("Erro ao excluir conexão")
      setTimeout(() => setSaveMessage(""), 3000)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
  }

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all"

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conexões WhatsApp</h1>
          <p className="text-gray-600">Todas as conexões WhatsApp dos usuários</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManualSync}
            disabled={syncing}
            className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            title="Sincronizar status das conexões"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            <span className="text-gray-700">{syncing ? "Sincronizando..." : "Sincronizar"}</span>
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Nova Conexão
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`mb-6 px-4 py-2 rounded-lg text-sm ${
            saveMessage.includes("sucesso") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Ocultar" : "Mostrar"} Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de busca sempre visível */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por usuário, email, nome da conexão ou instância..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filtros adicionais */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="connected">Conectado</SelectItem>
                    <SelectItem value="disconnected">Desconectado</SelectItem>
                    <SelectItem value="connecting">Conectando</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="gap-2">
                    <X className="w-4 h-4" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-start mb-6">
            <div className="text-sm text-gray-500">
              Mostrando {filteredConnections.length} de {connections.length} conexões
              {hasActiveFilters && " (filtrado)"}
              {syncing && <span className="ml-2 text-blue-600">• Sincronizando status...</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Conexões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredConnections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {connections.length === 0
                  ? "Nenhuma conexão WhatsApp encontrada"
                  : "Nenhuma conexão encontrada com os filtros aplicados"}
                {hasActiveFilters && (
                  <div className="mt-2">
                    <Button variant="link" onClick={clearFilters} className="text-sm">
                      Limpar filtros para ver todas as conexões
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              filteredConnections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{connection.connection_name}</div>
                      <div className="text-sm text-gray-600">
                        Usuário:{" "}
                        {connection.user_profiles?.full_name || connection.user_profiles?.email || "Desconhecido"}
                      </div>
                      <div className="text-xs text-gray-500">Instância: {connection.instance_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        connection.status === "connected"
                          ? "default"
                          : connection.status === "connecting"
                            ? "secondary"
                            : "secondary"
                      }
                      className={
                        connection.status === "connected"
                          ? "bg-green-100 text-green-700"
                          : connection.status === "connecting"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }
                    >
                      {connection.status === "connected"
                        ? "Conectado"
                        : connection.status === "connecting"
                          ? "Conectando"
                          : connection.status === "error"
                            ? "Erro"
                            : "Desconectado"}
                    </Badge>
                    <div className="flex gap-1">
                      {connection.status === "connected" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedConnection(connection)
                            setInfoModalOpen(true)
                          }}
                          title="Ver Informações"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedConnection(connection)
                            setQrModalOpen(true)
                          }}
                          title="Ver QR Code"
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedConnection(connection)
                          setSettingsModalOpen(true)
                        }}
                        title="Configurações"
                        className="border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedConnection(connection)
                          setTransferModalOpen(true)
                        }}
                        title="Transferir Propriedade"
                        className="border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      {(connection.status === "connected" || connection.status === "connecting") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectConnection(connection)}
                          title="Desconectar"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <PowerOff className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConnection(connection)}
                        title="Excluir"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <WhatsAppQRModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        connection={selectedConnection}
        onStatusChange={(status) => {
          if (selectedConnection) {
            supabase
              .from("whatsapp_connections")
              .update({ status })
              .eq("id", selectedConnection.id)
              .then(() => fetchConnections())
          }
        }}
      />

      <WhatsAppSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        connection={selectedConnection}
        onSettingsSaved={() => {
          setSaveMessage("Configurações salvas com sucesso!")
          setTimeout(() => setSaveMessage(""), 3000)
        }}
      />

      <WhatsAppInfoModal
        open={infoModalOpen}
        onOpenChange={setInfoModalOpen}
        connection={selectedConnection}
        onStatusChange={(status) => {
          if (selectedConnection) {
            supabase
              .from("whatsapp_connections")
              .update({ status })
              .eq("id", selectedConnection.id)
              .then(() => fetchConnections())
          }
        }}
      />

      <AdminWhatsAppConnectionModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        adminId={currentUser?.id}
        onSuccess={() => {
          fetchConnections()
          setSaveMessage("Conexão criada com sucesso!")
          setTimeout(() => setSaveMessage(""), 3000)
        }}
      />

      <TransferConnectionModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        connection={selectedConnection}
        onSuccess={() => {
          fetchConnections()
          setSaveMessage("Conexão transferida com sucesso!")
          setTimeout(() => setSaveMessage(""), 3000)
        }}
      />

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conexão "{connectionToDelete?.connection_name}"? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteConnection}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
