"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Users, MessageCircle, Phone } from "lucide-react"
import { formatPhoneNumber } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface WhatsAppInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: any
  onStatusChange?: (status: string) => void
}

export default function WhatsAppInfoModal({ open, onOpenChange, connection, onStatusChange }: WhatsAppInfoModalProps) {
  const [instanceDetails, setInstanceDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && connection) {
      setLoading(true)
      setError(null)

      const fetchDetails = async () => {
        try {
          const { data: integrationData } = await supabase
            .from("integrations")
            .select("config")
            .eq("type", "evolution_api")
            .eq("is_active", true)
            .single()

          if (!integrationData?.config?.apiUrl || !integrationData?.config?.apiKey) {
            throw new Error("Evolution API não configurada.")
          }

          const response = await fetch(`${integrationData.config.apiUrl}/instance/fetchInstances`, {
            method: "GET",
            headers: {
              apikey: integrationData.config.apiKey,
            },
          })

          if (!response.ok) {
            throw new Error(`Erro ao buscar detalhes: ${response.status}`)
          }

          const data = await response.json()

          const instanceDetails = Array.isArray(data)
            ? data.find((instance) => instance.name === connection.instance_name)
            : data

          if (!instanceDetails) {
            throw new Error("Instância não encontrada")
          }

          setInstanceDetails(instanceDetails)
        } catch (err) {
          console.error("Erro ao buscar detalhes:", err)
          setError(err instanceof Error ? err.message : "Erro desconhecido")
        } finally {
          setLoading(false)
        }
      }

      fetchDetails()
    }
  }, [open, connection])

  const phoneNumber = instanceDetails?.ownerJid ? instanceDetails.ownerJid.split("@")[0] : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Informações da Conexão</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-4">{error}</div>
        ) : instanceDetails ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-3">
              {instanceDetails.profilePicUrl ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20">
                  <img
                    src={instanceDetails.profilePicUrl || "/placeholder.svg"}
                    alt={instanceDetails.profileName || "Perfil WhatsApp"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Phone className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <h3 className="text-xl font-semibold text-foreground">{instanceDetails.profileName}</h3>
              <div className="text-sm text-muted-foreground">{formatPhoneNumber(phoneNumber)}</div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1 text-foreground">Nome da Instância</h4>
                <p className="text-sm text-muted-foreground">{instanceDetails.name}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1 text-foreground">Status</h4>
                <div className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      instanceDetails.connectionStatus === "open" ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  <span className="text-sm text-foreground">
                    {instanceDetails.connectionStatus === "open" ? "Conectado" : "Desconectado"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1 text-foreground">Integração</h4>
                <p className="text-sm text-muted-foreground">{instanceDetails.integration}</p>
              </div>
            </div>

            {instanceDetails._count && (
              <>
                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary mb-1" />
                    <span className="text-lg font-semibold text-foreground">
                      {instanceDetails._count.Message.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">Mensagens</span>
                  </div>

                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <Users className="h-5 w-5 text-primary mb-1" />
                    <span className="text-lg font-semibold text-foreground">
                      {instanceDetails._count.Contact.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">Contatos</span>
                  </div>

                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-primary mb-1" />
                    <span className="text-lg font-semibold text-foreground">
                      {instanceDetails._count.Chat.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">Chats</span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">Nenhuma informação disponível</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
