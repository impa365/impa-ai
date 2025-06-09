"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  full_name: string
  email: string
}

interface UserSelectProps {
  value?: string
  onValueChange: (value: string) => void
  label?: string
}

export function UserSelect({ value, onValueChange, label = "Usuário" }: UserSelectProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Simular busca de usuários
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setUsers([
          { id: "1", full_name: "João Silva", email: "joao@example.com" },
          { id: "2", full_name: "Maria Santos", email: "maria@example.com" },
          { id: "3", full_name: "Pedro Costa", email: "pedro@example.com" },
        ])
      } catch (error) {
        console.error("Erro ao buscar usuários:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Carregando..." : "Selecione um usuário"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os usuários</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.full_name} ({user.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
