"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Copy, Plus, Trash2, Code } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface ApiKey {
  id: string
  api_key: string
  description: string
  created_at: string
  last_used_at: string | null
}

export default function UserSettings() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Estados para perfil
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState("")

  // Estados para API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loadingApiKeys, setLoadingApiKeys] = useState(false)
  const [creatingApiKey, setCreatingApiKey] = useState(false)
  const [showApiExample, setShowApiExample] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    if (currentUser.role === "admin") {
      router.push("/admin")
      return
    }
    setUser(currentUser)
    setProfileForm({
      full_name: currentUser.full_name || "",
      email: currentUser.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setLoading(false)
    loadApiKeys()
  }, [router])

  const loadApiKeys = async () => {
    setLoadingApiKeys(true)
    try {
      const response = await fetch("/api/user/api-keys")
      const data = await response.json()
      if (response.ok) {
        setApiKeys(data.apiKeys || [])
      }
    } catch (error) {
      console.error("Erro ao carregar API keys:", error)
    } finally {
      setLoadingApiKeys(false)
    }
  }

  const createApiKey = async () => {
    setCreatingApiKey(true)
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "API Key para integração N8N" }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "API Key criada com sucesso!",
          description: "Sua nova API key foi gerada.",
        })
        loadApiKeys()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Erro ao criar API Key",
        description: "Não foi possível criar a API key.",
        variant: "destructive",
      })
    } finally {
      setCreatingApiKey(false)
    }
  }

  const deleteApiKey = async (id: string) => {
    try {
      const response = await fetch(`/api/user/api-keys?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "API Key removida",
          description: "A API key foi removida com sucesso.",
        })
        loadApiKeys()
      }
    } catch (error) {
      toast({
        title: "Erro ao remover API Key",
        description: "Não foi possível remover a API key.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    })
  }

  const handleUpdateProfile = async () => {
    setSavingProfile(true)
    setProfileMessage("")

    try {
      // Validações
      if (!profileForm.full_name.trim()) {
        setProfileMessage("Nome é obrigatório")
        return
      }

      if (!profileForm.email.trim()) {
        setProfileMessage("Email é obrigatório")
        return
      }

      if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileMessage("Senhas não coincidem")
        return
      }

      if (profileForm.newPassword && !profileForm.currentPassword) {
        setProfileMessage("Senha atual é obrigatória para alterar a senha")
        return
      }

      // Atualizar perfil
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: profileForm.full_name.trim(),
          email: profileForm.email.trim(),
        })
        .eq("id", user.id)

      if (error) throw error

      // Atualizar usuário local
      const updatedUser = {
        ...user,
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
      }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setProfileMessage("Perfil atualizado com sucesso!")
      setProfileForm({
        ...profileForm,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      setProfileMessage("Erro ao atualizar perfil")
    } finally {
      setSavingProfile(false)
      setTimeout(() => setProfileMessage(""), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const apiExampleCode = `// Exemplo de requisição para obter dados do agente
const response = await fetch('${window.location.origin}/api/getbot/SEU_BOT_ID', {
  method: 'GET',
  headers: {
    'apikey': 'SUA_API_KEY_AQUI'
  }
});

const botData = await response.json();
console.log(botData);

// Exemplo de resposta:
{
  "id": "bot-id",
  "name": "Nome do Bot",
  "description": "Descrição do bot",
  "transcribe_audio": true,
  "understand_images": false,
  "voice_response_enabled": true,
  "voice_config": {
    "provider": "eleven_labs",
    "api_key": "api-key",
    "voice_id": "voice-id"
  },
  "calendar_integration": false,
  "evolution_config": {
    "listening_from_me": false,
    "stop_bot_from_me": true,
    "keep_open": false,
    "debounce_time": 1000
  }
}`

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600">Gerencie suas configurações de perfil e API</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Seção de Perfil */}
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Informações do Perfil</h3>
            <p className="text-gray-600">Atualize suas informações pessoais e senha</p>
          </div>

          {profileMessage && (
            <Alert variant={profileMessage.includes("sucesso") ? "default" : "destructive"} className="mb-6">
              <AlertDescription>{profileMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      placeholder="Senha atual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      placeholder="Nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      placeholder="Confirme a nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleUpdateProfile}
              disabled={savingProfile}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              {savingProfile ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>

        {/* Seção de API Keys */}
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">API Keys para Integração</h3>
            <p className="text-gray-600">Gerencie suas chaves de API para integração com N8N e outros sistemas</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Suas API Keys</CardTitle>
                <Button onClick={createApiKey} disabled={creatingApiKey} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {creatingApiKey ? "Criando..." : "Nova API Key"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingApiKeys ? (
                <div className="text-center py-4">Carregando API keys...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma API key encontrada.</p>
                  <p className="text-sm">Crie uma API key para começar a integrar com N8N.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{apiKey.description}</h4>
                          <p className="text-sm text-gray-500">
                            Criada em {new Date(apiKey.created_at).toLocaleDateString()}
                          </p>
                          {apiKey.last_used_at && (
                            <p className="text-sm text-gray-500">
                              Último uso: {new Date(apiKey.last_used_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteApiKey(apiKey.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input value={apiKey.api_key} readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey.api_key)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exemplo de uso da API */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Exemplo de Uso da API</CardTitle>
                <Button variant="outline" onClick={() => setShowApiExample(!showApiExample)} className="gap-2">
                  <Code className="h-4 w-4" />
                  {showApiExample ? "Ocultar" : "Mostrar"} Exemplo
                </Button>
              </div>
            </CardHeader>
            {showApiExample && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">URL da API:</h4>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/api/getbot/[ID_DO_BOT]`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`${window.location.origin}/api/getbot/[ID_DO_BOT]`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Código de Exemplo:</h4>
                    <div className="relative">
                      <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{apiExampleCode}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(apiExampleCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Como usar no N8N:</strong>
                      <br />
                      1. Use o nó "HTTP Request"
                      <br />
                      2. Configure o método como GET
                      <br />
                      3. Cole a URL substituindo [ID_DO_BOT] pelo ID real do seu agente
                      <br />
                      4. Adicione o header "apikey" com sua API key
                      <br />
                      5. Execute para obter todos os dados do agente
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
