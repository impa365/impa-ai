"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QrCode, RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react"

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
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    if (open && connection?.instance_name) {
      fetchQRCode()
      startStatusPolling()
    } else {
      stopStatusPolling()
    }

    return () => stopStatusPolling()
  }, [open, connection?.instance_name])

  const fetchQRCode = async () => {
    if (!connection?.instance_name) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/whatsapp/qr/${connection.instance_name}`)
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

  const startStatusPolling = () => {
    if (polling) return

    setPolling(true)
    const interval = setInterval(async () => {
      if (!connection?.instance_name) return

      try {
        const response = await fetch(`/api/whatsapp/status/${connection.instance_name}`)
        const result = await response.json()

        if (result.success) {
          const newStatus = result.status
          setStatus(newStatus)

          if (newStatus === "connected") {
            onStatusChange?.(newStatus)
            setTimeout(() => {
              onOpenChange(false)
            }, 2000)
          }
        }
      } catch (error) {
        // Silently handle polling errors
      }
    }, 3000)

    // Store interval ID for cleanup
    ;(window as any).qrPollingInterval = interval
  }

  const stopStatusPolling = () => {
    setPolling(false)
    if ((window as any).qrPollingInterval) {
      clearInterval((window as any).qrPollingInterval)
      ;(window as any).qrPollingInterval = null
    }
  }

  const handleRefresh = () => {
    fetchQRCode()
  }

  const getStatusDisplay = () => {
    switch (status) {
      case "connected":
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          text: "Conectado",
          color: "text-green-600",
        }
      case "connecting":
        return {
          icon: <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />,
          text: "Conectando...",
          color: "text-yellow-600",
        }
      default:
        return {
          icon: <XCircle className="w-5 h-5 text-gray-600" />,
          text: "Desconectado",
          color: "text-gray-600",
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-popover-foreground">
            <QrCode className="w-5 h-5" />
            Conectar WhatsApp - {connection?.connection_name}
          </DialogTitle>
          <DialogDescription className="text-popover-foreground/80">
            Escaneie o QR Code com seu WhatsApp para conectar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              {statusDisplay.icon}
              <span className={`font-medium ${statusDisplay.color}`}>{statusDisplay.text}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status === "connected" && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                WhatsApp conectado com sucesso! Este modal será fechado automaticamente.
              </AlertDescription>
            </Alert>
          )}

          {/* QR Code */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando QR Code...</span>
            </div>
          ) : qrCode && status !== "connected" ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border">
                <img src={qrCode || "/placeholder.svg"} alt="QR Code WhatsApp" className="w-64 h-64 object-contain" />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Toque em Menu ou Configurações</p>
                <p>3. Toque em Aparelhos conectados</p>
                <p>4. Toque em Conectar um aparelho</p>
                <p>5. Aponte seu celular para esta tela para capturar o código</p>
              </div>
            </div>
          ) : !qrCode && status !== "connected" && !loading ? (
            <div className="flex flex-col items-center py-8 text-center">
              <QrCode className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Não foi possível gerar o QR Code. Tente atualizar.</p>
            </div>
          ) : null}

          {status === "connected" && (
            <div className="flex items-center justify-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
