"use client"

import type React from "react"
import { useState } from "react"
import type { Agent } from "@/types/agent"
import { AgentModal } from "./agent-modal"

interface AgentsClientPageProps {
  agents: Agent[]
}

const AgentsClientPage: React.FC<AgentsClientPageProps> = ({ agents }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const fetchAgents = async () => {
    // Recarregar os dados dos agentes
    window.location.reload() // Solução temporária
    // Ou implemente uma função para recarregar os dados
  }

  return (
    <div>
      {/* Your agent list display logic here */}
      <button onClick={() => setIsModalOpen(true)}>Open Agent Modal</button>

      <AgentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        agent={selectedAgent}
        onSave={() => {
          // Recarregar a lista de agentes após salvar
          fetchAgents()
          setSelectedAgent(null)
          setIsModalOpen(false)
        }}
        maxAgentsReached={false}
        isEditing={!!selectedAgent}
      />
    </div>
  )
}

export default AgentsClientPage
