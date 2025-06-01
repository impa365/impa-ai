"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Bot, Loader2, AlertCircle, Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Agent {
  id: string
  name: string
  identity_description: string | null
  voice_tone: string
  main_function: string
  status: string
  created_at: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userLimit, setUserLimit] = useState(5)

  const supabase = createClient()

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      setError("")

      // Buscar usuário atual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("Usuário não autenticado")
        return
      }

      // Buscar agentes
      const { data: agentsData, error: agentsError } = await supabase
        .from("ai_agents")
        .select("id, name, identity_description, voice_tone, main_function, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (agentsError) {
        console.error("Erro ao buscar agentes:", agentsError)
        setError("Erro ao carregar agentes")
        return
      }

      setAgents(agentsData || [])

      // Buscar limite do usuário
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("agents_limit")
        .eq("user_id", user.id)
        .single()

      if (settingsData?.agents_limit) {
        setUserLimit(settingsData.agents_limit)
      }
    } catch (err) {
      console.error("Erro geral:", err)
      setError("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (agentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return

    try {
      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)

      if (error) throw error

      setAgents((prev) => prev.filter((agent) => agent.id !== agentId))
    } catch (err) {
      console.error("Erro ao excluir:", err)
      setError("Erro ao excluir agente")
    }
  }

  const getFunctionLabel = (func: string) => {
    const functions: Record<string, string> = {
      atendimento: "Atendimento",
      vendas: "Vendas",
      suporte: "Suporte",
      agendamento: "Agendamento",
      qualificacao: "Qualificação",
    }
    return functions[func] || func
  }

  const getToneLabel = (tone: string) => {
    const tones: Record<string, string> = {
      humanizado: "Humanizado",
      formal: "Formal",
      tecnico: "Técnico",
      casual: "Casual",
      comercial: "Comercial",
    }
    return tones[tone] || tone
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Carregando agentes...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Agentes IA</h1>
          <p className="text-gray-600">
            Agentes: {agents.length} de {userLimit}
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={agents.length >= userLimit}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agente
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {agents.length >= userLimit && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">Você atingiu o limite de {userLimit} agentes.</AlertDescription>
        </Alert>
      )}

      {agents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum agente criado</h3>
            <p className="text-gray-600 mb-6">Crie seu primeiro agente IA para automatizar conversas</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={agents.length >= userLimit}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Agente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <p className="text-sm text-gray-600">{getFunctionLabel(agent.main_function)}</p>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      agent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {agent.status === "active" ? "Ativo" : "Inativo"}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">{agent.identity_description || "Sem descrição"}</p>

                  <div className="text-xs text-gray-500">Tom: {getToneLabel(agent.voice_tone)}</div>

                  <div className="text-xs text-gray-500">
                    Criado em {new Date(agent.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" title="Editar">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(agent.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
