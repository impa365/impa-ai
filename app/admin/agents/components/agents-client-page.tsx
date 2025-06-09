"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AgentModal, type WhatsAppConnection, type ConnectionFetchLog } from "./agent-modal"
import { PlusCircle, Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AgentsClientPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [fetchedConnections, setFetchedConnections] = useState<WhatsAppConnection[]>([])
  const [fetchLogs, setFetchLogs] = useState<ConnectionFetchLog[]>([])
  const [hasCheckedConnections, setHasCheckedConnections] = useState(false)
  const [connectionCheckError, setConnectionCheckError] = useState<string | null>(null)
  const { toast } = useToast()

  const addLog = useCallback((message: string, type: "info" | "error" | "success" = "info") => {
    console.log(`[LogPanel-${type.toUpperCase()}]: ${message}`)
    setFetchLogs((prevLogs) => [...prevLogs, { timestamp: new Date(), message, type }])
  }, [])

  // Verificar conexões disponíveis ao carregar a página
  useEffect(() => {
    checkAvailableConnections()
  }, [])

  const checkAvailableConnections = async () => {
    setIsLoadingConnections(true)
    setConnectionCheckError(null)

    try {
      console.log("[ConnectionCheck] Verificando conexões disponíveis...")
      const response = await fetch("/api/whatsapp-connections")

      if (!response.ok) {
        const errorData = await response.text()
        console.error("[ConnectionCheck] Erro na API:", response.status, errorData)
        setConnectionCheckError(`Erro ao verificar conexões: ${response.statusText}`)
        setFetchedConnections([])
        return
      }

      const result = await response.json()

      if (result.success && Array.isArray(result.connections)) {
        console.log(`[ConnectionCheck] ${result.connections.length} conexões encontradas`)
        setFetchedConnections(result.connections)
        setHasCheckedConnections(true)

        if (result.connections.length === 0) {
          console.warn("[ConnectionCheck] Nenhuma conexão disponível - botão será desabilitado")
        }
      } else {
        console.error("[ConnectionCheck] Resposta inválida da API:", result)
        setConnectionCheckError("Falha ao processar dados das conexões")
        setFetchedConnections([])
      }
    } catch (error: any) {
      console.error("[ConnectionCheck] Erro crítico:", error)
      setConnectionCheckError(`Erro de conexão: ${error.message}`)
      setFetchedConnections([])
    } finally {
      setIsLoadingConnections(false)
      setHasCheckedConnections(true)
    }
  }

  const handleOpenModal = async () => {
    // Se já temos conexões carregadas, abrir modal diretamente
    if (fetchedConnections.length > 0) {
      setIsModalOpen(true)
      return
    }

    // Se não temos conexões, fazer nova verificação
    setIsModalOpen(true)
    setIsLoadingConnections(true)
    setFetchLogs([])

    addLog("Iniciando busca de conexões WhatsApp...")
    const loadingToastId = `loading-connections-${Date.now()}`
    toast({
      id: loadingToastId,
      title: "Buscando Conexões...",
      description: (
        <div className="flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Aguarde enquanto buscamos as conexões WhatsApp.</span>
        </div>
      ),
      duration: 120000,
    })

    try {
      const response = await fetch("/api/whatsapp-connections")
      addLog(`Chamada API: ${response.url} - Status: ${response.status}`)

      const responseBody = await response.text()
      let result
      try {
        result = JSON.parse(responseBody)
        addLog("Resposta da API (JSON parseado): " + JSON.stringify(result, null, 2))
      } catch (parseError) {
        addLog(`Erro ao parsear JSON da resposta: ${parseError}. Corpo da resposta: ${responseBody}`, "error")
        throw new Error(`Falha ao parsear resposta da API. Status: ${response.status}`)
      }

      if (!response.ok) {
        addLog(`Erro da API: ${result.error || response.statusText}`, "error")
        toast.dismiss(loadingToastId)
        toast({
          variant: "destructive",
          title: "Erro ao Carregar Conexões",
          description: result.details || result.error || `Falha ao buscar dados: ${response.statusText}`,
        })
        setFetchedConnections([])
        return
      }

      if (result.success && Array.isArray(result.connections)) {
        addLog(`${result.connections.length} conexões recebidas com sucesso.`, "success")
        setFetchedConnections(result.connections)
        toast.dismiss(loadingToastId)
        toast({
          title: "Conexões Carregadas!",
          description: `${result.connections.length} conexões WhatsApp foram encontradas.`,
        })
      } else {
        addLog("API não retornou sucesso ou formato de conexões inválido.", "error")
        toast.dismiss(loadingToastId)
        toast({
          variant: "destructive",
          title: "Falha ao Processar Conexões",
          description: result.error || "A API não retornou os dados esperados.",
        })
        setFetchedConnections([])
      }
    } catch (error: any) {
      addLog(`Erro crítico ao buscar conexões: ${error.message}`, "error")
      toast.dismiss(loadingToastId)
      toast({
        variant: "destructive",
        title: "Erro Crítico na Busca",
        description: "Ocorreu um erro inesperado. Verifique o painel de logs no modal.",
      })
      setFetchedConnections([])
    } finally {
      setIsLoadingConnections(false)
      addLog("Processo de busca finalizado.")
    }
  }

  const handleSuccess = () => {
    console.log("Agente salvo com sucesso.")
  }

  // Determinar se o botão deve estar desabilitado
  const isButtonDisabled =
    isLoadingConnections || (hasCheckedConnections && fetchedConnections.length === 0) || connectionCheckError !== null

  // Texto do botão baseado no estado
  const getButtonText = () => {
    if (isLoadingConnections && !isModalOpen) return "Verificando Conexões..."
    if (isLoadingConnections && isModalOpen) return "Carregando..."
    if (connectionCheckError) return "Erro ao Verificar Conexões"
    if (hasCheckedConnections && fetchedConnections.length === 0) return "Sem Conexões Disponíveis"
    return "Criar Agente"
  }

  // Ícone do botão baseado no estado
  const getButtonIcon = () => {
    if (isLoadingConnections) return <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    if (connectionCheckError || (hasCheckedConnections && fetchedConnections.length === 0)) {
      return <AlertTriangle className="mr-2 h-4 w-4" />
    }
    return <PlusCircle className="mr-2 h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Agentes IA</h1>
          <p className="text-muted-foreground">Crie e gerencie os agentes de inteligência artificial.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={handleOpenModal}
            disabled={isButtonDisabled}
            variant={
              connectionCheckError || (hasCheckedConnections && fetchedConnections.length === 0)
                ? "destructive"
                : "default"
            }
          >
            {getButtonIcon()}
            {getButtonText()}
          </Button>

          {/* Informação adicional sobre o estado */}
          {hasCheckedConnections && fetchedConnections.length === 0 && !connectionCheckError && (
            <p className="text-xs text-muted-foreground text-right max-w-xs">
              É necessário ter pelo menos uma conexão WhatsApp para criar agentes
            </p>
          )}

          {connectionCheckError && <p className="text-xs text-red-500 text-right max-w-xs">{connectionCheckError}</p>}

          {hasCheckedConnections && fetchedConnections.length > 0 && (
            <p className="text-xs text-green-600 text-right">
              {fetchedConnections.length} conexão(ões) disponível(eis)
            </p>
          )}
        </div>
      </div>

      {/* Alert para quando não há conexões */}
      {hasCheckedConnections && fetchedConnections.length === 0 && !connectionCheckError && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Nenhuma conexão WhatsApp encontrada.</strong>
            <br />
            Para criar agentes IA, você precisa primeiro configurar pelo menos uma conexão WhatsApp.{" "}
            <a href="/admin/whatsapp" className="underline text-blue-600 hover:text-blue-800">
              Clique aqui para ir à página de Conexões WhatsApp
            </a>
            .
          </AlertDescription>
        </Alert>
      )}

      {/* Alert para erro na verificação */}
      {connectionCheckError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro ao verificar conexões:</strong> {connectionCheckError}
            <br />
            <Button
              variant="outline"
              size="sm"
              onClick={checkAvailableConnections}
              className="mt-2"
              disabled={isLoadingConnections}
            >
              {isLoadingConnections ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">A lista de agentes será exibida aqui.</p>
      </div>

      {isModalOpen && (
        <AgentModal
          open={isModalOpen}
          onOpenChange={(isOpen) => {
            setIsModalOpen(isOpen)
            if (!isOpen) {
              setFetchLogs([])
            }
          }}
          onSuccess={handleSuccess}
          whatsappConnections={fetchedConnections}
          isLoadingConnections={isLoadingConnections}
          fetchLogs={fetchLogs}
        />
      )}
    </div>
  )
}
