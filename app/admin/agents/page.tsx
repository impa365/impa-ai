"use client"

import type React from "react"

import { useState } from "react"
import type { User } from "@prisma/client"
import { toast } from "sonner"

import { useModal } from "@/hooks/use-modal"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { columns } from "./components/columns"
import { AgentModal } from "./components/agent-modal"
import { UserSelect } from "./components/user-select"

interface AgentsPageProps {
  users: User[]
  agents: any[]
}

const AgentsPage: React.FC<AgentsPageProps> = ({ users, agents }) => {
  const { onOpen } = useModal()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [agentModalOpen, setAgentModalOpen] = useState(false)

  const handleCreateAgent = async () => {
    if (!selectedUser) {
      toast({
        title: "Selecione um usuário",
        description: "Você precisa selecionar um usuário para criar um agente",
        variant: "destructive",
      })
      return
    }

    setAgentModalOpen(true)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Agentes</h1>
        <div className="flex items-center space-x-2">
          <UserSelect users={users} onChange={(user) => setSelectedUser(user)} />
          <Button onClick={handleCreateAgent}>Criar Agente</Button>
        </div>
      </div>
      <DataTable columns={columns} data={agents} />
      <AgentModal open={agentModalOpen} onClose={() => setAgentModalOpen(false)} userId={selectedUser?.id} />
    </div>
  )
}

export default AgentsPage
