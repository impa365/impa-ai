"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fetchInstanceDetails } from "@/lib/whatsapp-api"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Users, MessageCircle, Phone } from "lucide-react"
import { formatPhoneNumber } from "@/lib/utils"

interface WhatsAppInfoModalProps {
  isOpen: boolean
  onClose: () => void
  instanceName: string
  apiKey: string
}

interface InstanceDetails {
  id: string
  name: string
  connectionStatus: string
  ownerJid: string
  profileName: string
  profilePicUrl: string
  integration: string
  number: string | null
  businessId: string | null
  token: string
  clientName: string
  _count?: {
    Message: number
    Contact: number
    Chat: number
  }
}

export function WhatsAppInfoModal({ isOpen, onClose, instanceName, apiKey }: WhatsAppInfoModalProps) {
  const [instanceDetails, setInstanceDetails] = useState<InstanceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError(null)

      fetchInstanceDetails(instanceName, apiKey)
        .then((data) => {
          setInstanceDetails(data)
        })
        .catch((err) => {
          setError("Falha ao carregar informações da conexão")
          console.error(err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, instanceName, apiKey])

  // Extract phone number from ownerJid (remove the @s.whatsapp.net part)
  const phoneNumber = instanceDetails?.ownerJid ? instanceDetails.ownerJid.split("@")[0] : ""

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Informações da Conexão</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
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
              <h3 className="text-xl font-semibold">{instanceDetails.profileName}</h3>
              <div className="text-sm text-muted-foreground">{formatPhoneNumber(phoneNumber)}</div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Nome da Instância</h4>
                <p className="text-sm">{instanceDetails.name}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Status</h4>
                <div className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      instanceDetails.connectionStatus === "open" ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  <span className="text-sm">
                    {instanceDetails.connectionStatus === "open" ? "Conectado" : "Desconectado"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Integração</h4>
                <p className="text-sm">{instanceDetails.integration}</p>
              </div>
            </div>

            {instanceDetails._count && (
              <>
                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary mb-1" />
                    <span className="text-lg font-semibold">{instanceDetails._count.Message.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">Mensagens</span>
                  </div>

                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <Users className="h-5 w-5 text-primary mb-1" />
                    <span className="text-lg font-semibold">{instanceDetails._count.Contact.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">Contatos</span>
                  </div>

                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-primary mb-1" />
                    <span className="text-lg font-semibold">{instanceDetails._count.Chat.toLocaleString()}</span>
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
