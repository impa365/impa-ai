"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AgentDuplicateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: any
  onSuccess: () => void
}

export function AgentDuplicateDialog({ open, onOpenChange, agent, onSuccess }: AgentDuplicateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [newName, setNewName] = useState(`${agent?.name || ""} (cópia)`)

  const handleDuplicate = async () => {
    if (!newName.trim()) {
      setError("Nome do agente é obrigatório")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Buscar dados completos do agente
      const { data: agentData, error: fetchError } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", agent.id)
        .single()

      if (fetchError) throw fetchError

      // Criar novo agente com os mesmos dados, mas com nome diferente
      const newAgent = {
        ...agentData,
        id: undefined, // Remover ID para gerar um novo
        name: newName.trim(),
        evolution_bot_id: undefined, // Será gerado um novo na Evolution API
        created_at: undefined,
        updated_at: undefined,
        is_default: false, // Não duplicar como padrão
      }

      const { error: insertError } = await supabase.from("ai_agents").insert([newAgent])

      if (insertError) throw insertError

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao duplicar agente:", error)
      setError(error.message || "Erro ao duplicar agente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Duplicar Agente
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">Nome do novo agente</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Digite o nome do novo agente"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Esta ação irá criar uma cópia exata do agente "{agent?.name}" com todas as suas configurações, mas com um
              novo nome.
            </p>
            <p className="mt-2">
              Um novo bot será criado na Evolution API quando você acessar o agente duplicado pela primeira vez.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleDuplicate} disabled={loading}>
            {loading ? "Duplicando..." : "Duplicar Agente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Exportar como default também
export default AgentDuplicateDialog
