"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import { DynamicTitle } from "@/components/dynamic-title"
import { 
  Download, 
  Copy, 
  RefreshCw, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ExternalLink
} from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Workflow {
  id?: string
  workflow_id: string
  name: string
  descricao?: string
  workflow_data: any
  categoria?: any[]
  imagem_fluxo?: string
  criado_em?: string
  ultima_atualizacao?: string
  synced_to_n8n?: boolean
  n8n_workflow_id?: string
  updated_at?: string
  prioridade?: number
}

export default function N8nWorkflowsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [externalWorkflows, setExternalWorkflows] = useState<any[]>([])
  const [syncing, setSyncing] = useState(false)
  const [fetchingExternal, setFetchingExternal] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<"sync" | "create" | "update" | null>(null)
  const [n8nConfigured, setN8nConfigured] = useState(false)
  const [n8nUrl, setN8nUrl] = useState<string>("")
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showCopied, setShowCopied] = useState(false)
  const [copiedWorkflowName, setCopiedWorkflowName] = useState<string>("")
  const [copyTimer, setCopyTimer] = useState<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/")
      return
    }
    setUser(currentUser)
    loadData()
  }, [router])

  const loadData = async () => {
    setLoading(true)
    try {
      await checkN8nConfiguration()
      await loadWorkflows()
      // Buscar workflows da API automaticamente ao carregar a página
      await fetchExternalWorkflows()
    } catch (error) {
      console.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const checkN8nConfiguration = async () => {
    try {
      const response = await fetch("/api/integrations")
      const data = await response.json()
      
      if (data.success && Array.isArray(data.integrations)) {
        const n8nIntegration = data.integrations.find((int: any) => int.type === "n8n_api")
        const url = n8nIntegration?.config?.n8n_url || ""
        setN8nConfigured(!!url)
        setN8nUrl(url)
      }
    } catch (error) {
      console.error("Erro ao verificar configuração do n8n")
    }
  }

  const loadWorkflows = async () => {
    try {
      const response = await fetch("/api/n8n-workflows")
      const data = await response.json()
      
      if (data.success) {
        setWorkflows(data.workflows || [])
      }
    } catch (error) {
      console.error("Erro ao carregar workflows")
    }
  }

  const fetchExternalWorkflows = async () => {
    setFetchingExternal(true)
    try {
      const response = await fetch("/api/n8n-workflows/fetch-external")
      const data = await response.json()
      
      if (data.success) {
        const externalData = data.workflows || []
        
        // Salvar dados da API no estado para comparação
        setExternalWorkflows(externalData)
        
        // NÃO sincroniza automaticamente - apenas salva no estado
        // A sincronização só acontece quando o usuário clicar no botão
        
        if (data.count > 0) {
          toast({
            title: "Workflows da API carregados!",
            description: `${data.count} workflow(s) disponível(is) na API`,
          })
        }
      } else {
        throw new Error(data.error || "Erro ao buscar workflows")
      }
    } catch (error: any) {
      console.error("❌ Erro ao buscar workflows:", error)
      // Não mostrar erro na primeira carga automática
    } finally {
      setFetchingExternal(false)
    }
  }

  const syncAllNewWorkflows = async () => {
    if (externalWorkflows.length === 0) {
      toast({
        title: "Nenhum workflow encontrado",
        description: "Clique em 'Buscar Workflows da API' primeiro",
        variant: "destructive",
      })
      return
    }

    setSyncing(true)
    try {
      const response = await fetch("/api/n8n-workflows/sync-new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workflows: externalWorkflows }),
      })

      const data = await response.json()
      
      if (data.success) {
        await loadWorkflows()
        
        toast({
          title: "Sincronização concluída!",
          description: `${data.createdCount} novos, ${data.skippedCount} já existentes`,
        })
      } else {
        throw new Error(data.error || "Erro ao sincronizar")
      }
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const syncNewWorkflows = async (workflowsToSync: any[]) => {
    // Sincroniza APENAS workflows novos (create-only, sem update)
    try {
      const response = await fetch("/api/n8n-workflows/sync-new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workflows: workflowsToSync }),
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Erro ao sincronizar")
      }
    } catch (error: any) {
      console.error("Erro ao sincronizar workflows novos:", error)
    }
  }



  const createInN8n = async (workflow: Workflow) => {
    try {
      const response = await fetch("/api/n8n-workflows/create-in-n8n", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflow_data: workflow.workflow_data,
          workflow_id: workflow.workflow_id,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        await loadWorkflows()
        toast({
          title: "Workflow criado no n8n!",
          description: `Workflow "${workflow.name}" criado com sucesso`,
        })
      } else {
        throw new Error(data.error || "Erro ao criar workflow")
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar workflow no n8n",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const updateInN8n = async (workflow: Workflow) => {
    try {
      // Buscar data de atualização da API
      const externalWorkflow = externalWorkflows.find(
        (ext) => ext.workflow?.id === workflow.workflow_id
      )
      
      const response = await fetch("/api/n8n-workflows/update-in-n8n", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflow_data: workflow.workflow_data,
          workflow_id: workflow.workflow_id,
          n8n_workflow_id: workflow.n8n_workflow_id,
          ultima_atualizacao: externalWorkflow?.ultima_atualizacao, // Data da API
          force_update: true, // Confirmação explícita do usuário
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        await loadWorkflows()
        toast({
          title: "Workflow atualizado no n8n!",
          description: `Workflow "${workflow.name}" atualizado com sucesso`,
        })
      } else {
        throw new Error(data.error || "Erro ao atualizar workflow")
      }
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar workflow no n8n",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (workflow: Workflow) => {
    const workflowJson = JSON.stringify(workflow.workflow_data, null, 2)
    navigator.clipboard.writeText(workflowJson)
    
    // Limpar timer anterior se existir
    if (copyTimer) {
      clearTimeout(copyTimer)
    }
    
    // Atualizar nome e mostrar popup
    setCopiedWorkflowName(workflow.name)
    setShowCopied(true)
    
    // Criar novo timer
    const timer = setTimeout(() => {
      setShowCopied(false)
      setCopiedWorkflowName("")
    }, 3000)
    setCopyTimer(timer)
    
    toast({
      title: "Copiado!",
      description: `${workflow.name} copiado para área de transferência`,
    })
  }

  const needsUpdate = (workflow: Workflow) => {
    const externalWorkflow = externalWorkflows.find(
      (ext) => ext.workflow?.id === workflow.workflow_id
    )
    
    if (!externalWorkflow || !externalWorkflow.ultima_atualizacao) return false
    
    // Data da última atualização na API
    const apiUpdateDate = new Date(externalWorkflow.ultima_atualizacao)
    
    // Data que o workflow foi sincronizado/atualizado no banco local
    const localSyncDate = new Date(workflow.ultima_atualizacao || workflow.updated_at || 0)
    
    // Retorna true se API tem versão mais recente
    return apiUpdateDate > localSyncDate
  }

  const handleSyncDialog = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setDialogAction("sync")
    setDialogOpen(true)
  }

  const handleCreateDialog = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setDialogAction("create")
    setDialogOpen(true)
  }

  const handleUpdateDialog = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setDialogAction("update")
    setDialogOpen(true)
  }

  const confirmAction = async () => {
    if (!selectedWorkflow) return

    if (dialogAction === "sync") {
      // Atualizar workflow apenas no banco local (sem n8n)
      const externalWorkflow = externalWorkflows.find(
        (ext) => ext.workflow?.id === selectedWorkflow.workflow_id
      )
      
      if (externalWorkflow) {
        try {
          const response = await fetch("/api/n8n-workflows/update-local", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workflow_id: selectedWorkflow.workflow_id,
              workflow_data: externalWorkflow.workflow?.fluxo || externalWorkflow.workflow,
              ultima_atualizacao: externalWorkflow.ultima_atualizacao,
              force_update: true, // Confirmação explícita do usuário
            }),
          })
          
          if (response.ok) {
            await loadWorkflows()
            toast({
              title: "Workflow atualizado!",
              description: `Workflow "${selectedWorkflow.name}" atualizado com sucesso`,
            })
          }
        } catch (error: any) {
          toast({
            title: "Erro ao atualizar workflow",
            description: error.message,
            variant: "destructive",
          })
        }
      }
    } else if (dialogAction === "create") {
      await createInN8n(selectedWorkflow)
    } else if (dialogAction === "update") {
      await updateInN8n(selectedWorkflow)
    }

    setDialogOpen(false)
    setSelectedWorkflow(null)
    setDialogAction(null)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando workflows...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DynamicTitle suffix="N8N Workflows" />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">N8N Workflows</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie workflows do n8n disponíveis na plataforma IMPA
          </p>
        </div>

        {!n8nConfigured && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure a integração N8N API em{" "}
              <a href="/admin/settings" className="underline font-semibold">
                Configurações → Integrações
              </a>{" "}
              para poder criar workflows diretamente no seu n8n.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4 mb-6">
          <Button
            onClick={fetchExternalWorkflows}
            disabled={fetchingExternal}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {fetchingExternal ? "Atualizar da API" : "Atualizar da API"}
          </Button>

          {externalWorkflows.length > 0 && (
            <Button
              onClick={syncAllNewWorkflows}
              disabled={syncing}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {syncing ? "Sincronizando..." : `Sincronizar Novos (${externalWorkflows.length})`}
            </Button>
          )}
        </div>

        {workflows.length === 0 && !fetchingExternal && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-4 text-gray-400">
                <Download className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum workflow no banco</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {externalWorkflows.length > 0 
                  ? `${externalWorkflows.length} workflow(s) disponível(is) na API. Clique em "Sincronizar Novos" para adicionar ao banco.`
                  : "Os workflows da API são carregados automaticamente ao abrir esta página."}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => {
            const hasUpdate = needsUpdate(workflow)
            
            return (
              <Card key={workflow.id || workflow.workflow_id} className="overflow-hidden">
                <CardHeader className="p-0">
                  {workflow.imagem_fluxo ? (
                    <div 
                      className="relative w-full h-48 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setSelectedImage(workflow.imagem_fluxo!)
                        setImageModalOpen(true)
                      }}
                    >
                      <Image
                        src={workflow.imagem_fluxo}
                        alt={workflow.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-6xl">⚡</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    {workflow.synced_to_n8n && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  {workflow.categoria && Array.isArray(workflow.categoria) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {workflow.categoria.map((cat: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <CardDescription className="mb-4 text-sm">
                    {workflow.descricao || "Workflow do n8n"}
                  </CardDescription>

                  {hasUpdate && (
                    <Alert className="mb-4 py-2">
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Atualização disponível
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(workflow)}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar
                    </Button>
                    
                    {n8nConfigured && !workflow.synced_to_n8n && (
                      <Button
                        onClick={() => handleCreateDialog(workflow)}
                        size="sm"
                        className="flex-1 gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Criar no n8n
                      </Button>
                    )}

                    {hasUpdate && (
                      <Button
                        onClick={() => {
                          // Se já está sincronizado no n8n, atualiza lá também
                          if (workflow.synced_to_n8n && workflow.n8n_workflow_id) {
                            handleUpdateDialog(workflow)
                          } else {
                            // Senão, só sincroniza no banco local
                            handleSyncDialog(workflow)
                          }
                        }}
                        size="sm"
                        variant="secondary"
                        className="gap-2 relative"
                        title={workflow.synced_to_n8n ? "⚠️ Irá sobrescrever alterações no n8n" : "Atualizar workflow no banco local"}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Atualizar
                        {workflow.synced_to_n8n && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                          </span>
                        )}
                      </Button>
                    )}

                    {workflow.synced_to_n8n && workflow.n8n_workflow_id && n8nUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2"
                        asChild
                      >
                        <a 
                          href={`${n8nUrl}/workflow/${workflow.n8n_workflow_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogAction === "sync" && "Sincronizar Workflow"}
                {dialogAction === "create" && "Criar Workflow no n8n"}
                {dialogAction === "update" && "⚠️ Atualizar Workflow no n8n"}
              </DialogTitle>
              {dialogAction === "sync" && (
                <DialogDescription>
                  Deseja atualizar o workflow "{selectedWorkflow?.name}" no banco local com a versão mais recente da API?
                </DialogDescription>
              )}
              
              {dialogAction === "create" && (
                <DialogDescription>
                  Deseja criar o workflow "{selectedWorkflow?.name}" no seu n8n?
                </DialogDescription>
              )}
              
              {dialogAction === "update" && (
                <div className="space-y-3">
                  <DialogDescription>
                    Você está prestes a atualizar o workflow <strong>"{selectedWorkflow?.name}"</strong> no seu n8n com a versão mais recente da API.
                  </DialogDescription>
                  
                  <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-sm text-orange-900 dark:text-orange-200">
                      <strong>Atenção:</strong> Todas as alterações que você fez manualmente no n8n serão perdidas e substituídas pela versão da API.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Recomendação:</strong> Antes de continuar, exporte/salve seu workflow atual no n8n caso tenha feito modificações importantes.
                  </div>
                </div>
              )}
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmAction}
                variant={dialogAction === "update" ? "destructive" : "default"}
              >
                {dialogAction === "update" ? "Atualizar e Sobrescrever" : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showCopied && (
          <div 
            key={copiedWorkflowName}
            className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 max-w-md"
          >
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium">Workflow copiado!</span>
              <span className="text-xs text-green-100 truncate">{copiedWorkflowName}</span>
            </div>
          </div>
        )}

        <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
          <DialogContent className="max-w-6xl w-full">
            <DialogHeader>
              <DialogTitle>Visualização do Workflow</DialogTitle>
              <DialogDescription className="text-xs">
                Use a roda do mouse para dar zoom • Arraste para mover
              </DialogDescription>
            </DialogHeader>
            {selectedImage && (
              <div className="relative w-full h-[70vh] overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div 
                  className="relative min-w-full min-h-full cursor-move"
                  style={{
                    transformOrigin: 'center center',
                  }}
                  onWheel={(e) => {
                    const container = e.currentTarget
                    const delta = e.deltaY * -0.001
                    const currentScale = parseFloat(container.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1')
                    const newScale = Math.min(Math.max(0.5, currentScale + delta), 5)
                    container.style.transform = `scale(${newScale})`
                  }}
                  onMouseDown={(e) => {
                    const container = e.currentTarget.parentElement!
                    const startX = e.clientX + container.scrollLeft
                    const startY = e.clientY + container.scrollTop
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      container.scrollLeft = startX - moveEvent.clientX
                      container.scrollTop = startY - moveEvent.clientY
                    }
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }
                    
                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                >
                  <Image
                    src={selectedImage}
                    alt="Workflow"
                    width={2000}
                    height={2000}
                    className="w-full h-auto"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
