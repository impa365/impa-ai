"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Copy, Eye, EyeOff, Key, Link as LinkIcon, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface WhatsAppCredentialsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectionId: string
  connectionName: string
}

interface Credentials {
  connection_id: string
  connection_name: string
  api_type: string
  api_url: string
  api_key: string
}

export default function WhatsAppCredentialsModal({
  open,
  onOpenChange,
  connectionId,
  connectionName,
}: WhatsAppCredentialsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  // Buscar credenciais quando o modal abre
  const fetchCredentials = async () => {
    if (!connectionId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/whatsapp-connections/${connectionId}/credentials`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (response.status === 403) {
          throw new Error("Você não tem permissão para visualizar credenciais. Contate um administrador.")
        }
        if (response.status === 429) {
          throw new Error("Muitas requisições. Aguarde alguns minutos e tente novamente.")
        }
        if (response.status === 404) {
          throw new Error("Conexão não encontrada.")
        }
        
        throw new Error(errorData.error || "Erro ao carregar credenciais")
      }

      const data = await response.json()
      setCredentials(data.data)
    } catch (err: any) {
      console.error("❌ Erro ao buscar credenciais:", err)
      setError(err.message || "Erro ao carregar credenciais")
    } finally {
      setLoading(false)
    }
  }

  // Copiar para clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "✅ Copiado!",
        description: `${label} copiado para a área de transferência`,
      })
    } catch (err) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível copiar",
        variant: "destructive",
      })
    }
  }

  // Buscar credenciais quando o modal abre
  useEffect(() => {
    if (open && connectionId) {
      fetchCredentials()
    }
  }, [open, connectionId])

  // Resetar estado ao fechar
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Limpar dados ao fechar por segurança
      setCredentials(null)
      setShowApiKey(false)
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Credenciais da API
          </DialogTitle>
          <DialogDescription>
            URL e API Key da conexão <strong>{connectionName}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm text-gray-600">Carregando credenciais...</p>
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {credentials && !loading && !error && (
          <div className="space-y-6 py-4">
            {/* Tipo de API */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Tipo de API</Label>
              <div className="mt-1.5 px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                <span className="text-sm font-medium">
                  {credentials.api_type === "uazapi" ? "Uazapi" : "Evolution API"}
                </span>
              </div>
            </div>

            {/* URL da API */}
            <div>
              <Label htmlFor="api_url" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                URL da API
              </Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="api_url"
                  value={credentials.api_url}
                  readOnly
                  className="flex-1 bg-gray-50 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(credentials.api_url, "URL da API")}
                  title="Copiar URL"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* API Key */}
            <div>
              <Label htmlFor="api_key" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key
              </Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="api_key"
                  type={showApiKey ? "text" : "password"}
                  value={credentials.api_key}
                  readOnly
                  className="flex-1 bg-gray-50 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? "Ocultar" : "Mostrar"}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(credentials.api_key, "API Key")}
                  title="Copiar API Key"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Alerta de segurança */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                <strong>Importante:</strong> Não compartilhe essas credenciais com terceiros. 
                Elas dão acesso total à sua instância WhatsApp.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
