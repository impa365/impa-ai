"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Smartphone, QrCode, Settings, UserPlus, Trash2, RefreshCcw, Search, Info } from "lucide-react"
import { WhatsAppQRModal } from "@/components/whatsapp-qr-modal"
import { WhatsAppSettingsModal } from "@/components/whatsapp-settings-modal"
import { TransferConnectionModal } from "@/components/transfer-connection-modal"
import { WhatsAppInfoModal } from "@/components/whatsapp-info-modal"
import { AdminWhatsAppConnectionModal } from "@/components/admin-whatsapp-connection-modal"
import { fetchWhatsAppInstances, disconnectWhatsAppInstance, deleteWhatsAppInstance } from "@/lib/whatsapp-api"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface User {
  id: string
  email: string
  name?: string
}

interface WhatsAppInstance {
  id: string
  name: string
  status: "disconnected" | "connecting" | "connected"
  user_id: string
  api_key: string
  user?: {
    id: string
    email: string
    name?: string
  }
  profile_pic_url?: string
}

export default function WhatsAppPage() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [filteredInstances, setFilteredInstances] = useState<WhatsAppInstance[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterInstances()
  }, [instances, searchTerm, statusFilter, userFilter])

  async function fetchData() {
    setIsLoading(true)
    try {
      // Fetch WhatsApp instances
      const instancesData = await fetchWhatsAppInstances()
      setInstances(instancesData)

      // Fetch users
      const { data: usersData, error: usersError } = await supabase.from("users").select("id, email, name")

      if (usersError) {
        throw usersError
      }

      setUsers(usersData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function filterInstances() {
    let filtered = [...instances]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (instance) =>
          instance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instance.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instance.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((instance) => instance.status === statusFilter)
    }

    // Filter by user
    if (userFilter !== "all") {
      filtered = filtered.filter((instance) => instance.user_id === userFilter)
    }

    setFilteredInstances(filtered)
  }

  async function handleDisconnect(instance: WhatsAppInstance) {
    setActionLoading(instance.id)
    try {
      await disconnectWhatsAppInstance(instance.name, instance.api_key)
      // Update the instance status in the local state
      setInstances((prevInstances) =>
        prevInstances.map((i) => (i.id === instance.id ? { ...i, status: "disconnected" } : i)),
      )
    } catch (error) {
      console.error("Error disconnecting instance:", error)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(instance: WhatsAppInstance) {
    setActionLoading(instance.id)
    try {
      await deleteWhatsAppInstance(instance.name, instance.api_key)
      // Remove the instance from the local state
      setInstances((prevInstances) => prevInstances.filter((i) => i.id !== instance.id))
    } catch (error) {
      console.error("Error deleting instance:", error)
    } finally {
      setActionLoading(null)
    }
  }

  function handleQRCode(instance: WhatsAppInstance) {
    setSelectedInstance(instance)
    setIsQRModalOpen(true)
  }

  function handleSettings(instance: WhatsAppInstance) {
    setSelectedInstance(instance)
    setIsSettingsModalOpen(true)
  }

  function handleTransfer(instance: WhatsAppInstance) {
    setSelectedInstance(instance)
    setIsTransferModalOpen(true)
  }

  function handleInfo(instance: WhatsAppInstance) {
    setSelectedInstance(instance)
    setIsInfoModalOpen(true)
  }

  function handleCreateConnection() {
    setIsConnectionModalOpen(true)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "connected":
        return <Badge variant="success">Conectado</Badge>
      case "connecting":
        return <Badge variant="warning">Conectando</Badge>
      case "disconnected":
        return <Badge variant="destructive">Desconectado</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Conexões WhatsApp</h1>
        <Button onClick={handleCreateConnection}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nova Conexão
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as conexões por usuário, status ou nome</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="connected">Conectado</SelectItem>
                <SelectItem value="connecting">Conectando</SelectItem>
                <SelectItem value="disconnected">Desconectado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conexões ({filteredInstances.length})</CardTitle>
          <CardDescription>Gerencie as conexões WhatsApp dos usuários</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredInstances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma conexão encontrada</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInstances.map((instance) => (
                <Card key={instance.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg truncate" title={instance.name}>
                          {instance.name}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {instance.user?.name || instance.user?.email || "Usuário desconhecido"}
                        </CardDescription>
                      </div>
                      <div className="ml-2">{getStatusBadge(instance.status)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center mr-3">
                        {instance.profile_pic_url ? (
                          <img
                            src={instance.profile_pic_url || "/placeholder.svg"}
                            alt="Perfil"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Smartphone className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">ID: {instance.id.substring(0, 8)}...</div>
                        <div className="text-xs text-muted-foreground">
                          API Key: {instance.api_key.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Disconnect button - show only when status is connected or connecting */}
                      {(instance.status === "connected" || instance.status === "connecting") && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDisconnect(instance)}
                          disabled={actionLoading === instance.id}
                          className="w-full"
                        >
                          {actionLoading === instance.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              Desconectar
                            </>
                          )}
                        </Button>
                      )}

                      {/* QR Code button for disconnected/connecting or Info button for connected */}
                      {instance.status === "connected" ? (
                        <Button variant="outline" size="sm" onClick={() => handleInfo(instance)} className="w-full">
                          <Info className="mr-2 h-4 w-4" />
                          Informações
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleQRCode(instance)} className="w-full">
                          <QrCode className="mr-2 h-4 w-4" />
                          QR Code
                        </Button>
                      )}

                      {/* Settings button */}
                      <Button variant="outline" size="sm" onClick={() => handleSettings(instance)} className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurar
                      </Button>

                      {/* Transfer button */}
                      <Button variant="outline" size="sm" onClick={() => handleTransfer(instance)} className="w-full">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Transferir
                      </Button>

                      {/* Delete button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(instance)}
                        disabled={actionLoading === instance.id}
                        className="w-full"
                      >
                        {actionLoading === instance.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {selectedInstance && (
        <WhatsAppQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          instanceName={selectedInstance.name}
          apiKey={selectedInstance.api_key}
          status={selectedInstance.status}
        />
      )}

      {/* Settings Modal */}
      {selectedInstance && (
        <WhatsAppSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          instanceName={selectedInstance.name}
          apiKey={selectedInstance.api_key}
        />
      )}

      {/* Transfer Modal */}
      {selectedInstance && (
        <TransferConnectionModal
          isOpen={isTransferModalOpen}
          onClose={() => {
            setIsTransferModalOpen(false)
            fetchData() // Refresh data after transfer
          }}
          instance={selectedInstance}
          users={users}
        />
      )}

      {/* Info Modal */}
      {selectedInstance && (
        <WhatsAppInfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          instanceName={selectedInstance.name}
          apiKey={selectedInstance.api_key}
        />
      )}

      {/* Connection Modal */}
      <AdminWhatsAppConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => {
          setIsConnectionModalOpen(false)
          fetchData() // Refresh data after creating a new connection
        }}
        users={users}
      />
    </div>
  )
}
