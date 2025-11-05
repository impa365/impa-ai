"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Key, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface LLMApiKey {
  id?: string
  key_name: string
  provider: string
  api_key: string
  description?: string
  is_active?: boolean
  is_default?: boolean
}

interface LLMApiKeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiKey?: LLMApiKey | null
  onSave: () => void
  isAdmin?: boolean
  selectedUserId?: string
  currentUserId?: string // ID do usuário logado
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI", placeholder: "sk-..." },
  { value: "anthropic", label: "Anthropic (Claude)", placeholder: "sk-ant-..." },
  { value: "google", label: "Google (Gemini)", placeholder: "AIza..." },
  { value: "ollama", label: "Ollama (Local)", placeholder: "http://localhost:11434" },
  { value: "groq", label: "Groq", placeholder: "gsk_..." },
]

export function LLMApiKeyModal({
  open,
  onOpenChange,
  apiKey,
  onSave,
  isAdmin = false,
  selectedUserId,
  currentUserId,
}: LLMApiKeyModalProps) {
  const [formData, setFormData] = useState<LLMApiKey>({
    key_name: "",
    provider: "openai",
    api_key: "",
    description: "",
    is_active: true,
    is_default: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string>(selectedUserId || "")
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (open) {
      if (apiKey) {
        setFormData({
          ...apiKey,
          api_key: "", // Não preencher a chave por segurança (usuário deve re-digitar para atualizar)
        })
      } else {
        setFormData({
          key_name: "",
          provider: "openai",
          api_key: "",
          description: "",
          is_active: true,
          is_default: false,
        })
      }
      setError(null)
      setShowApiKey(false)
      
      // Pré-selecionar usuário: prioritário (selectedUserId > currentUserId > "")
      const initialUser = selectedUserId || currentUserId || ""
      setSelectedUser(initialUser)
      console.log("👤 [LLMKeyModal] Pré-selecionando usuário:", initialUser)
      
      // Buscar usuários se for admin (SEMPRE, não importa se tem selectedUserId)
      if (isAdmin) {
        fetchUsers()
      }
    }
  }, [open, apiKey, isAdmin])

  const fetchUsers = async () => {
    console.log("🔄 [LLMKeyModal] Buscando usuários...")
    setLoadingUsers(true)
    try {
      const response = await fetch("/api/admin/users")
      console.log("📡 [LLMKeyModal] Resposta da API:", response.status)
      
      if (!response.ok) {
        console.error("❌ [LLMKeyModal] Erro HTTP:", response.status)
        return
      }
      
      const data = await response.json()
      console.log("✅ [LLMKeyModal] Dados recebidos:", data)
      
      // Aceitar tanto { users: [...] } quanto { success: true, users: [...] }
      const usersList = data.users || []
      if (usersList.length > 0) {
        console.log("✅ [LLMKeyModal] Usuários carregados:", usersList.length)
        setUsers(usersList)
      } else {
        console.warn("⚠️ [LLMKeyModal] Nenhum usuário encontrado")
        setUsers([])
      }
    } catch (error) {
      console.error("❌ [LLMKeyModal] Erro ao buscar usuários:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validações
      if (!formData.key_name.trim()) {
        throw new Error("Nome da chave é obrigatório")
      }

      if (!formData.provider) {
        throw new Error("Provedor é obrigatório")
      }

      // Se estiver editando e não forneceu nova chave, não enviar o campo api_key
      const payload: any = {
        key_name: formData.key_name.trim(),
        provider: formData.provider,
        description: formData.description?.trim() || null,
        is_active: formData.is_active,
        is_default: formData.is_default,
      }

      // Se tem chave ou é criação, incluir api_key
      if (formData.api_key.trim() || !apiKey) {
        if (!formData.api_key.trim()) {
          throw new Error("API key é obrigatória")
        }
        payload.api_key = formData.api_key.trim()
      }

      // Se estiver editando, incluir ID
      if (apiKey?.id) {
        payload.id = apiKey.id
      }

      // Se for admin, incluir user_id
      if (isAdmin) {
        const userId = selectedUser || selectedUserId
        if (!userId) {
          throw new Error("Selecione um usuário")
        }
        payload.user_id = userId
      }

      const apiPath = isAdmin ? "/api/admin/llm-keys" : "/api/user/llm-keys"
      const method = apiKey ? "PUT" : "POST"

      console.log(`🔐 ${method} ${apiPath}:`, {
        key_name: payload.key_name,
        provider: payload.provider,
      })

      const response = await fetch(apiPath, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Erro ao salvar API key")
      }

      toast({
        title: apiKey ? "API Key atualizada" : "API Key criada",
        description: apiKey
          ? "A chave foi atualizada com sucesso."
          : "A nova chave foi criada com sucesso.",
      })

      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("❌ Erro ao salvar API key:", error)
      setError(error.message)
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedProvider = PROVIDERS.find((p) => p.value === formData.provider)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              {apiKey ? "Editar API Key" : "Nova API Key"}
            </DialogTitle>
            <DialogDescription>
              {apiKey
                ? "Atualize as informações da API key. Deixe o campo da chave vazio para mantê-la inalterada."
                : "Configure uma nova chave API para usar com seus agentes de IA."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Seleção de usuário (apenas para admin sem usuário pré-selecionado) */}
            {isAdmin && !selectedUserId && (
              <div className="space-y-2">
                <Label htmlFor="user_select">
                  Usuário <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedUser} onValueChange={setSelectedUser} disabled={loadingUsers}>
                  <SelectTrigger id="user_select" className="w-full">
                    <SelectValue placeholder="Selecione o usuário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingUsers ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Carregando usuários...</span>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="flex items-center justify-center p-2 text-muted-foreground">
                        Nenhum usuário encontrado
                      </div>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email} ({user.email})
                          {currentUserId && user.id === currentUserId ? " - Você" : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione o usuário dono desta chave API
                  {!loadingUsers && ` (${users.length} disponível${users.length !== 1 ? 'is' : ''})`}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="key_name">
                Nome da Chave <span className="text-red-500">*</span>
              </Label>
              <Input
                id="key_name"
                name="key_name"
                value={formData.key_name}
                onChange={handleInputChange}
                placeholder="Ex: OpenAI Produção, Claude Personal..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Um nome descritivo para identificar esta chave
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">
                Provedor <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, provider: value }))}
                disabled={!!apiKey} // Não permitir alterar provedor ao editar
              >
                <SelectTrigger id="provider" className="w-full">
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">
                API Key {apiKey && "(deixe vazio para manter a atual)"}
                {!apiKey && <span className="text-red-500"> *</span>}
              </Label>
              <div className="relative">
                <Input
                  id="api_key"
                  name="api_key"
                  type={showApiKey ? "text" : "password"}
                  value={formData.api_key}
                  onChange={handleInputChange}
                  placeholder={selectedProvider?.placeholder || "Cole sua API key aqui"}
                  required={!apiKey}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Sua chave API será armazenada de forma segura
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                placeholder="Adicione notas sobre esta chave..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Ativa
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_default: checked }))
                  }
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  Padrão para este provedor
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : apiKey ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

