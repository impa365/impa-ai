"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/auth"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Key, Plus, Pencil, Trash2, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { LLMApiKeyModal } from "@/components/llm-api-key-modal"
import Link from "next/link"

interface LLMApiKey {
  id: string
  key_name: string
  provider: string
  api_key_preview: string
  description?: string
  is_active: boolean
  is_default: boolean
  usage_count: number
  last_used_at?: string
  created_at: string
  updated_at: string
  user_profiles?: {
    id: string
    email: string
    full_name: string
  }
}

interface User {
  id: string
  email: string
  full_name: string
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  google: "Google (Gemini)",
  ollama: "Ollama",
  groq: "Groq",
}

export default function AdminLLMKeysPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [keys, setKeys] = useState<LLMApiKey[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<LLMApiKey | null>(null)
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("all")

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      router.push("/")
      return
    }
    setCurrentUser(user)
  }, [router])

  useEffect(() => {
    fetchUsers()
    fetchKeys()
  }, [selectedUserId])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      if (data.success) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    }
  }

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const url =
        selectedUserId === "all"
          ? "/api/admin/llm-keys"
          : `/api/admin/llm-keys?user_id=${selectedUserId}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setKeys(data.keys || [])
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao carregar API keys",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Erro ao buscar keys:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar API keys",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = () => {
    setSelectedKey(null)
    setModalOpen(true)
  }

  const handleEditKey = (key: LLMApiKey) => {
    setSelectedKey(key)
    setModalOpen(true)
  }

  const handleDeleteKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/admin/llm-keys?id=${keyId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "API Key deletada",
          description: "A chave foi removida com sucesso",
        })
        fetchKeys()
      } else {
        throw new Error(data.error || "Erro ao deletar")
      }
    } catch (error: any) {
      console.error("Erro ao deletar key:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar API key",
        variant: "destructive",
      })
    } finally {
      setKeyToDelete(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/admin/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Configurações
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Key className="w-8 h-8" />
          API Keys LLM
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as chaves API dos provedores de IA para todos os usuários
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys Cadastradas</CardTitle>
              <CardDescription>
                Gerencie as chaves API dos provedores OpenAI, Anthropic, Google, etc.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filtrar por usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateKey} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova API Key
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma API key cadastrada
              {selectedUserId !== "all" && " para este usuário"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.key_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{PROVIDER_LABELS[key.provider] || key.provider}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{key.user_profiles?.full_name}</div>
                        <div className="text-muted-foreground">{key.user_profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{key.api_key_preview}</code>
                    </TableCell>
                    <TableCell>
                      {key.is_active ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {key.is_default && <Badge className="bg-blue-500">Padrão</Badge>}
                    </TableCell>
                    <TableCell>{key.usage_count || 0}x</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(key.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditKey(key)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setKeyToDelete(key.id)}
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LLMApiKeyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        apiKey={selectedKey}
        onSave={fetchKeys}
        isAdmin={true}
        selectedUserId={selectedUserId !== "all" ? selectedUserId : undefined}
        currentUserId={currentUser?.id}
      />

      <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta API key? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => keyToDelete && handleDeleteKey(keyToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

