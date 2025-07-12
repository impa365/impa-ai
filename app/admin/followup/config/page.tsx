"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, Settings, MessageSquare, Phone } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"

interface WhatsAppConnection {
  id: string
  connection_name: string
  instance_name: string
  status: string
  phone_number?: string
  adciona_folow?: string
  remover_folow?: string
}

interface ConnectionConfig {
  adciona_folow?: string
  remover_folow?: string
}

export default function FollowUpConfigPage() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<string>("")
  const [config, setConfig] = useState<ConnectionConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      window.location.href = "/"
      return
    }
    setUser(currentUser)
    loadConnections(currentUser)
  }, [])

  const loadConnections = async (currentUser: any) => {
    try {
      setLoading(true)
      const isAdmin = currentUser.role === "admin"
      
      const response = await fetch(
        `/api/whatsapp-connections?userId=${currentUser.id}&isAdmin=${isAdmin}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setConnections(data.connections || [])
          if (data.connections?.length > 0) {
            setSelectedConnection(data.connections[0].id)
            loadConnectionConfig(data.connections[0])
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar conexões:", error)
      setMessage({ type: "error", text: "Erro ao carregar conexões WhatsApp" })
    } finally {
      setLoading(false)
    }
  }

  const loadConnectionConfig = async (connection: WhatsAppConnection) => {
    try {
      // Carregar as mensagens diretamente das colunas adciona_folow e remover_folow
      setConfig({
        adciona_folow: connection.adciona_folow || "",
        remover_folow: connection.remover_folow || ""
      })
    } catch (error) {
      console.error("Erro ao carregar configuração:", error)
    }
  }

  const handleConnectionChange = (connectionId: string) => {
    setSelectedConnection(connectionId)
    const connection = connections.find(c => c.id === connectionId)
    if (connection) {
      loadConnectionConfig(connection)
    }
  }

  const handleConfigChange = (field: keyof ConnectionConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveConfig = async () => {
    if (!selectedConnection) return

    try {
      setSaving(true)
      
      const connection = connections.find(c => c.id === selectedConnection)
      if (!connection) return

      const response = await fetch(`/api/whatsapp/settings/${connection.instance_name}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adciona_folow: config.adciona_folow,
          remover_folow: config.remover_folow
        }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Configurações salvas com sucesso!" })
        
        // Atualizar a lista local
        setConnections(prev => 
          prev.map(conn => 
            conn.id === selectedConnection 
              ? { 
                  ...conn, 
                  adciona_folow: config.adciona_folow,
                  remover_folow: config.remover_folow
                }
              : conn
          )
        )
      } else {
        throw new Error("Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setMessage({ type: "error", text: "Erro ao salvar configurações" })
    } finally {
      setSaving(false)
    }
  }

  const selectedConnectionData = connections.find(c => c.id === selectedConnection)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configuração Follow Diário</h1>
      </div>

      {message && (
        <Alert className={message.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}>
          <AlertDescription className={message.type === "error" ? "text-red-700" : "text-green-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Selecionar Conexão WhatsApp</span>
          </CardTitle>
          <CardDescription>
            Escolha a conexão WhatsApp para configurar mensagens de entrada e saída do follow-up
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="connection">Conexão WhatsApp</Label>
              <Select value={selectedConnection} onValueChange={handleConnectionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conexão" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id}>
                      <div className="flex items-center space-x-2">
                        <span>{connection.connection_name}</span>
                        <span className="text-sm text-gray-500">({connection.instance_name})</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          connection.status === "connected" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {connection.status === "connected" ? "Conectado" : "Desconectado"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConnectionData && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Informações da Conexão</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Nome:</span>
                    <span className="ml-2 font-medium">{selectedConnectionData.connection_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Instância:</span>
                    <span className="ml-2 font-medium">{selectedConnectionData.instance_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-medium ${
                      selectedConnectionData.status === "connected" ? "text-green-600" : "text-red-600"
                    }`}>
                      {selectedConnectionData.status === "connected" ? "Conectado" : "Desconectado"}
                    </span>
                  </div>
                  {selectedConnectionData.phone_number && (
                    <div>
                      <span className="text-gray-600">Telefone:</span>
                      <span className="ml-2 font-medium">{selectedConnectionData.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedConnection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Configurações de Mensagens Follow-up</span>
            </CardTitle>
            <CardDescription>
              Configure mensagens de entrada e saída do follow-up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Mensagem de Entrada no Follow */}
              <div>
                <Label htmlFor="adciona_folow">Mensagem de Entrada no Follow</Label>
                <Textarea
                  id="adciona_folow"
                  placeholder="Digite a mensagem que será enviada quando um lead entrar no follow-up..."
                  value={config.adciona_folow || ""}
                  onChange={(e) => handleConfigChange("adciona_folow", e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Esta mensagem será enviada quando um contato for adicionado ao follow-up diário
                </p>
              </div>

              {/* Mensagem de Saída do Follow */}
              <div>
                <Label htmlFor="remover_folow">Mensagem de Saída do Follow</Label>
                <Textarea
                  id="remover_folow"
                  placeholder="Digite a mensagem que será enviada quando um lead sair do follow-up..."
                  value={config.remover_folow || ""}
                  onChange={(e) => handleConfigChange("remover_folow", e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Esta mensagem será enviada quando um contato for removido do follow-up diário
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveConfig} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 