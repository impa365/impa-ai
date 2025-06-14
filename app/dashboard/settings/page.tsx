"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { changePassword } from "@/lib/auth"

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
  }, [router])

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
        console.error("Erro ao atualizar perfil:", error)
        throw error
      }

      // Se há nova senha, trocar a senha
      if (profileForm.newPassword) {
        const passwordResult = await changePassword(user.id, profileForm.currentPassword, profileForm.newPassword)

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
      console.error("Erro ao atualizar perfil:", error)
      setProfileMessage("Erro ao atualizar perfil: " + error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600">Gerencie suas configurações de perfil</p>
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
      </div>
    </div>
  )
}
