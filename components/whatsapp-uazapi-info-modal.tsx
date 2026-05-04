"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Copy, Eye, EyeOff, AlertTriangle, Link as LinkIcon, Key, Hash, Server } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface WhatsAppUazapiInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: any
}

interface UazapiInfo {
  connection_id: string
  connection_name: string
  instance_name: string
  instance_id: string
  instance_token: string
  server_url: string
}

export default function WhatsAppUazapiInfoModal({
  open,
  onOpenChange,
  connection,
}: WhatsAppUazapiInfoModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<UazapiInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)

  const fetchInfo = async () => {
    if (!connection?.id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/whatsapp-connections/${connection.id}/uazapi-info`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao carregar informações")
      }

      const data = await response.json()
      setInfo(data.data)
    } catch (err: any) {
      console.error("❌ Erro ao buscar info Uazapi:", err)
      setError(err.message || "Erro ao carregar informações")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "✅ Copiado!",
        description: `${label} copiado para a área de transferência`,
      })
    } catch {
      toast({
        title: "❌ Erro",
        description: "Não foi possível copiar",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (open && connection?.id) {
      fetchInfo()
    }
  }, [open, connection?.id])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInfo(null)
      setShowToken(false)
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-600" />
            Informações da Instância Uazapi
          </DialogTitle>
          <DialogDescription>
            Dados da conexão{" "}
            <strong>{connection?.connection_name}</strong>
            {" "}
            <Badge
              variant="outline"
              className="ml-1 bg-purple-50 text-purple-700 border-purple-200 text-xs"
            >
              Uazapi
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
            <p className="text-sm text-gray-600">Carregando informações...</p>
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {info && !loading && !error && (
          <div className="space-y-5 py-2">
            {/* URL do servidor */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <LinkIcon className="w-4 h-4 text-purple-500" />
                URL do Servidor Uazapi
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={info.server_url || "Não configurado"}
                  className="font-mono text-sm bg-gray-50"
                />
                {info.server_url && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(info.server_url, "URL do servidor")}
                    title="Copiar URL"
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Token / API Key da instância */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Key className="w-4 h-4 text-purple-500" />
                Token da Instância (API Key)
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  type={showToken ? "text" : "password"}
                  value={info.instance_token || "Não disponível"}
                  className="font-mono text-sm bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowToken((v) => !v)}
                  title={showToken ? "Ocultar token" : "Mostrar token"}
                  className="shrink-0"
                >
                  {showToken ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                {info.instance_token && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(info.instance_token, "Token da instância")}
                    title="Copiar token"
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Nome da instância */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Hash className="w-4 h-4 text-purple-500" />
                Nome da Instância
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={info.instance_name || "Não disponível"}
                  className="font-mono text-sm bg-gray-50"
                />
                {info.instance_name && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(info.instance_name, "Nome da instância")}
                    title="Copiar nome"
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* ID da instância */}
            {info.instance_id && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Hash className="w-4 h-4 text-purple-500" />
                  ID da Instância
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={info.instance_id}
                    className="font-mono text-sm bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(info.instance_id, "ID da instância")}
                    title="Copiar ID"
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
