"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QrCode, RefreshCw, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface WhatsAppQRModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: any
  onStatusChange?: (status: string) => void
}

export default function WhatsAppQRModal({ open, onOpenChange, connection, onStatusChange }: WhatsAppQRModalProps) {
  const [qrCode, setQrCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  useEffect(() => {
    if (open && connection?.id) {
      fetchQRCode()
      // Verificar status a cada 5 segundos
      const interval = setInterval(checkConnectionStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [open, connection?.id])

  const fetchQRCode = async () => {
    if (!connection?.id) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/whatsapp/qr/${connection.id}`)
      const result = await response.json()

      if (result.success) {
        setQrCode(result.qrCode || "")
        setStatus(result.status || "disconnected")
      } else {
        setError(result.error || "Erro ao buscar QR Code")
      }
    } catch (error) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const checkConnectionStatus = async () => {
    if (!connection?.id) return

    try {
      const response = await fetch(`/api/whatsapp/status/${connection.id}`)
      const result = await response.json()

      if (result.success) {
        const newStatus = result.status
        setStatus(newStatus)
        onStatusChange?.(newStatus)

        if (newStatus === "connected") {
          setQrCode("")
        }
      }
    } catch (error) {
      // Silencioso - não mostrar erro para verificação de status
    }
  }

  const handleRefresh = () => {
    fetchQRCode()
  }

  const getStatusMessage = () => {
    switch (status) {
      case "connected":
        return {
          message: "WhatsApp conectado com sucesso!",
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          variant: "default" as const,
        }
      case "connecting":
        return {
          message: "Conectando... Escaneie o QR Code no seu WhatsApp.",
          icon: <Loader2 className="w-5 h-5 animate-spin text-blue-600" />,
          variant: "default" as const,
        }
      default:
        return {
          message: "Escaneie o QR Code com seu WhatsApp para conectar.",
          icon: <QrCode className="w-5 h-5 text-gray-600" />,
          variant: "default" as const,
        }
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-popover-foreground">
            <QrCode className="w-5 h-5" />
            Conectar WhatsApp - {connection?.connection_name}
          </DialogTitle>
          <DialogDescription className="text-popover-foreground/80">
            {status === "connected"
              ? "Sua conexão WhatsApp está ativa"
              : "Escaneie o QR Code com seu WhatsApp para conectar"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert variant={statusInfo.variant}>
            <div className="flex items-center gap-2">
              {statusInfo.icon}
              <AlertDescription>{statusInfo.message}</AlertDescription>
            </div>
          </Alert>

          {status === "connected" ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700">Conectado com Sucesso!</h3>
              <p className="text-sm text-muted-foreground mt-2">Sua conexão WhatsApp está ativa e funcionando.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Gerando QR Code...</span>
                </div>
              ) : qrCode ? (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img src={qrCode || "/placeholder.svg"} alt="QR Code WhatsApp" className="w-64 h-64 mx-auto" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    1. Abra o WhatsApp no seu celular
                    <br />
                    2. Toque em Menu (⋮) &gt; Aparelhos conectados
                    <br />
                    3. Toque em "Conectar um aparelho"
                    <br />
                    4. Escaneie este QR Code
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Clique em "Gerar QR Code" para começar</p>
                </div>
              )}

              <div className="flex justify-center">
                <Button onClick={handleRefresh} disabled={loading} variant="outline" className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Gerando..." : "Gerar QR Code"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
