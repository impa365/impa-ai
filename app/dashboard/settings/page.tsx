"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Copy, Plus, Trash2, Code, BadgeIcon as UIBadge } from "lucide-react" // Renomeado para evitar conflito
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { changePassword } from "@/lib/auth"

interface ApiKey {
  id: string
  api_key: string
  name: string
  description: string
  created_at: string
  last_used_at: string | null
  is_active: boolean
  is_admin_key: boolean
  access_scope: string
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
  const [newKeyName, setNewKeyName] = useState("")
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)

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
    // loadApiKeys é chamado no useEffect abaixo quando 'user' é setado
  }, [router])

  const loadApiKeys = async () => {
    if (!user?.id) return

    setLoadingApiKeys(true)
    try {
      const response = await fetch(`/api/user/api-keys?user_id=${user.id}`) // Assegura que user.id existe
      const data = await response.json()
      if (response.ok) {
        setApiKeys(data.apiKeys || [])
      } else {
        if (process.env.NODE_ENV === "development") {
          console.error("Erro ao carregar API keys:", data.error)
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Erro ao carregar API keys:", error)
      }
    } finally {
      setLoadingApiKeys(false)
    }
  }

  const createApiKey = async (isAdminKey = false) => {
    if (!user?.id) return

    setCreatingApiKey(true)
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName || (isAdminKey ? "API Key de Administrador" : "API Key para integração N8N"),
          description: isAdminKey
            ? "API Key com acesso global a todos os bots do sistema"
            : "API Key para integração com sistemas externos",
          user_id: user.id,
          is_admin_key: isAdminKey,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: `API Key ${isAdminKey ? "de Administrador" : ""} criada com sucesso!`,
          description: `Sua nova API key ${isAdminKey ? "com acesso global" : ""} foi gerada.`,
        })
        setNewKeyName("")
        setShowNewKeyForm(false)
        loadApiKeys()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar API Key",
        description: error.message || "Não foi possível criar a API key.",
        variant: "destructive",
      })
    } finally {
      setCreatingApiKey(false)
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/user/api-keys?id=${id}&user_id=${user.id}`, {
        // Assegura user.id
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
      description: "Comando copiado para a área de transferência.",
    })
  }

  const handleUpdateProfile = async () => {
    setSavingProfile(true)
    setProfileMessage("")

    try {
      // Validações
      if (!profileForm.full_name.trim()) {
        setProfileMessage("Nome é obrigatório")
        setSavingProfile(false)
        return
      }

      if (!profileForm.email.trim()) {
        setProfileMessage("Email é obrigatório")
        setSavingProfile(false)
        return
      }

      if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileMessage("Senhas não coincidem")
        setSavingProfile(false)
        return
      }

      if (profileForm.newPassword && !profileForm.currentPassword) {
        setProfileMessage("Senha atual é obrigatória para alterar a senha")
        setSavingProfile(false)
        return
      }

      if (profileForm.newPassword && profileForm.newPassword.length < 6) {
        setProfileMessage("A nova senha deve ter pelo menos 6 caracteres")
        setSavingProfile(false)
        return
      }

      // Atualizar perfil
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: profileForm.full_name.trim(),
          email: profileForm.email.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Erro ao atualizar perfil:", error)
        }
        throw error
      }

      // Se há nova senha, trocar a senha
      if (profileForm.newPassword) {
        if (process.env.NODE_ENV === "development") {
          console.log("Alterando senha do usuário:", user.id)
        }

        const passwordResult = await changePassword(user.id, profileForm.currentPassword, profileForm.newPassword)

        if (process.env.NODE_ENV === "development") {
          // Não logar passwordResult inteiro se contiver dados sensíveis.
          console.log("Resultado da alteração de senha (sucesso/erro):", passwordResult.success, passwordResult.error)
        }

        if (!passwordResult.success) {
          setProfileMessage(passwordResult.error || "Erro ao alterar senha")
          setSavingProfile(false)
          return
        }
      }

      // Atualizar usuário local
      const updatedUser = {
        ...user,
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
      }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setProfileMessage("Perfil atualizado com sucesso!" + (profileForm.newPassword ? " Senha alterada." : ""))
      setProfileForm({
        ...profileForm,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Erro ao atualizar perfil:", error)
      }
      setProfileMessage("Erro ao atualizar perfil: " + error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  // Recarregar API keys quando user estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadApiKeys()
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const curlExample = `curl -X GET "${typeof window !== "undefined" ? window.location.origin : ""}/api/getbot/SEU_BOT_ID" \\
  -H "apikey: SUA_API_KEY_AQUI"`

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
                {!showNewKeyForm ? (
                  <Button
                    onClick={() => setShowNewKeyForm(true)}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Nova API Key
                  </Button>
                ) : (
                  <Button onClick={() => setShowNewKeyForm(false)} variant="outline">
                    Cancelar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showNewKeyForm && (
                <div className="mb-6 p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Criar Nova API Key</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="keyName">Nome da API Key</Label>
                      <Input
                        id="keyName"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="Ex: Integração N8N"
                        className="mb-4"
                      />
                    </div>
                    <Button
                      onClick={() => createApiKey(false)} // isAdminKey = false
                      className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={creatingApiKey}
                    >
                      {creatingApiKey ? "Criando..." : "Criar API Key"}
                    </Button>
                  </div>
                </div>
              )}

              {user?.role === "admin" && ( // Somente admin pode criar chave de admin
                <div className="mb-4 p-4 border rounded-lg bg-red-50">
                  <h4 className="font-medium mb-3 text-red-800">Criar API Key de Administrador</h4>
                  <p className="text-sm text-red-600 mb-3">
                    API Keys de administrador podem acessar todos os bots do sistema, não apenas os seus.
                  </p>
                  <Button
                    onClick={() => {
                      setNewKeyName("API Key de Administrador") // Nome padrão para chave de admin
                      createApiKey(true) // true para is_admin_key
                    }}
                    className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
                    disabled={creatingApiKey}
                  >
                    {creatingApiKey ? "Criando..." : "Criar API Key de Administrador"}
                  </Button>
                </div>
              )}

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
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{apiKey.name}</h4>
                            {apiKey.is_admin_key && (
                              <UIBadge className="bg-red-100 text-red-700 text-xs">ADMIN</UIBadge>
                            )}
                            <UIBadge variant="outline" className="text-xs">
                              {apiKey.access_scope === "admin" ? "Acesso Global" : "Acesso Próprio"}
                            </UIBadge>
                          </div>
                          {apiKey.description && <p className="text-sm text-gray-600">{apiKey.description}</p>}
                          <p className="text-sm text-gray-500">
                            Criada em {new Date(apiKey.created_at).toLocaleDateString()}
                          </p>
                          {apiKey.last_used_at && (
                            <p className="text-sm text-gray-500">
                              Último uso: {new Date(apiKey.last_used_at).toLocaleDateString()}
                            </p>
                          )}
                          {apiKey.is_active === false && <p className="text-sm text-red-500 font-medium">Inativa</p>}
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
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">1. Listar todos os seus bots:</h4>
                    <div className="relative">
                      <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                        <code>{`curl -X GET "${typeof window !== "undefined" ? window.location.origin : ""}/api/getbots" \\
  -H "apikey: SUA_API_KEY_AQUI"`}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          copyToClipboard(`curl -X GET "${typeof window !== "undefined" ? window.location.origin : ""}/api/getbots" \\
  -H "apikey: SUA_API_KEY_AQUI"`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">2. Obter detalhes de um bot específico:</h4>
                    <div className="relative">
                      <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                        <code>{curlExample}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(curlExample)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Como usar:</strong>
                      <br />
                      1. <strong>Primeiro</strong>: Use o comando 1 para listar todos os seus bots e pegar os IDs
                      <br />
                      2. <strong>Depois</strong>: Use o comando 2 substituindo "SEU_BOT_ID" pelo ID do bot desejado
                      <br />
                      3. Substitua "SUA_API_KEY_AQUI" pela sua API key em ambos os comandos
                      <br />
                      4. Execute no terminal ou use no N8N
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
