"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Smartphone, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"
import { getInstanceQRCode } from "@/lib/whatsapp-api"

interface WhatsAppQRModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: any
  onStatusChange: (status: string) => void
}

export default function WhatsAppQRModal({ open, onOpenChange, connection, onStatusChange }: WhatsAppQRModalProps) {
  const [qrCode, setQrCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(40)
  const [isExpired, setIsExpired] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = () => {
    setTimeLeft(40)
    setIsExpired(false)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true)
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startStatusCheck = () => {
    if (statusCheckRef.current) {
      clearInterval(statusCheckRef.current)
    }

    statusCheckRef.current = setInterval(async () => {
      if (!connection?.instance_name) return

      try {
        // Implementar verificação de status via API
      } catch (error) {
        console.error("Erro ao verificar status:", error)
      }
    }, 3000)
  }

  const fetchQRCode = async () => {
    if (!connection?.instance_name) return

    setLoading(true)
    setError("")

    try {
      const result = await getInstanceQRCode(connection.instance_name)

      if (result.success && result.qrCode) {
        setQrCode(result.qrCode)
        startTimer()
        startStatusCheck()
        onStatusChange("connecting")
      } else {
        setError(result.error || "Erro ao gerar QR Code")
      }
    } catch (error) {
      setError("Erro interno do servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshQR = () => {
    fetchQRCode()
  }

  useEffect(() => {
    if (open && connection) {
      fetchQRCode()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current)
      }
    }
  }, [open, connection])

  const getStatusBadge = () => {
    if (loading) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Carregando
        </Badge>
      )
    }

    if (connection?.status === "connected") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Conectado
        </Badge>
      )
    }

    if (connection?.status === "connecting") {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Conectando
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <XCircle className="w-3 h-3 mr-1" />
        Desconectado
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Smartphone className="w-5 h-5" />
            Conectar WhatsApp - {connection?.connection_name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Escaneie o QR Code com seu WhatsApp para conectar
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center mb-4">{getStatusBadge()}</div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex justify-center">
            {loading ? (
              <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : qrCode ? (
              <div className="relative">
                <img
                  src={qrCode || "/placeholder.svg"}
                  alt="QR Code WhatsApp"
                  className={`w-64 h-64 border rounded-lg ${isExpired ? "opacity-50" : ""}`}
                />
                {isExpired && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="text-white text-center">
                      <XCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">QR Code Expirado</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center text-muted-foreground">
                  <Smartphone className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Clique em "Gerar QR Code"</p>
                </div>
              </div>
            )}
          </div>

          {qrCode && !isExpired && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Tempo restante:</span>
                <span className="font-mono text-foreground">{timeLeft}s</span>
              </div>
              <Progress value={(timeLeft / 40) * 100} className="h-2" />
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium mb-2 flex items-center text-blue-800 dark:text-blue-200">
              <Smartphone className="w-4 h-4 mr-2" />
              Como conectar:
            </h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-blue-700 dark:text-blue-300">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Toque em "Mais opções" (⋮) e depois "Aparelhos conectados"</li>
              <li>Toque em "Conectar um aparelho"</li>
              <li>Aponte a câmera para este QR Code</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRefreshQR}
              disabled={loading}
              className="flex-1"
              variant={isExpired ? "default" : "outline"}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {isExpired ? "Gerar Novo QR Code" : "Atualizar QR Code"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="text-foreground">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
