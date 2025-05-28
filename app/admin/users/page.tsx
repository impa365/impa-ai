"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import UserModal from "@/components/user-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null)
  const [deleteUserModal, setDeleteUserModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [systemLimits, setSystemLimits] = useState({
    defaultLimit: 2,
  })

  useEffect(() => {
    fetchUsers()
    fetchSystemSettings()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false })
      if (data) setUsers(data)
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemSettings = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "default_whatsapp_connections_limit")
      .single()

    if (data) {
      setSystemLimits({ defaultLimit: data.setting_value })
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setSaving(true)
    try {
      await supabase.from("whatsapp_connections").delete().eq("user_id", userToDelete.id)
      await supabase.from("user_settings").delete().eq("user_id", userToDelete.id)
      const { error } = await supabase.from("user_profiles").delete().eq("id", userToDelete.id)

      if (error) throw error

      await fetchUsers()
      setDeleteUserModal(false)
      setUserToDelete(null)
      setSaveMessage("Usuário deletado com sucesso!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
      setSaveMessage("Erro ao deletar usuário")
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-600">Controle total sobre usuários do sistema</p>
        </div>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setSelectedUserForEdit(null)
            setUserModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {saveMessage && (
        <div
          className={`mb-6 px-4 py-2 rounded-lg text-sm ${
            saveMessage.includes("sucesso") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultLimit">Limite Padrão de Conexões WhatsApp</Label>
              <Input
                id="defaultLimit"
                type="number"
                value={systemLimits.defaultLimit}
                onChange={(e) => setSystemLimits({ defaultLimit: Number.parseInt(e.target.value) || 2 })}
                min="1"
                max="10"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={async () => {
                  await supabase.from("system_settings").upsert({
                    setting_key: "default_whatsapp_connections_limit",
                    setting_value: systemLimits.defaultLimit,
                  })
                  setSaveMessage("Configurações salvas!")
                  setTimeout(() => setSaveMessage(""), 3000)
                }}
              >
                Salvar Configurações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{user.full_name || "Sem nome"}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500">
                      Último login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Nunca"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className={
                      user.status === "active"
                        ? "bg-green-100 text-green-700"
                        : user.status === "inactive"
                          ? "bg-gray-100 text-gray-700"
                          : user.status === "suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {user.status === "active"
                      ? "Ativo"
                      : user.status === "inactive"
                        ? "Inativo"
                        : user.status === "suspended"
                          ? "Suspenso"
                          : "Hibernado"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {user.role === "admin" ? "Admin" : "Usuário"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUserForEdit(user)
                        setUserModalOpen(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => {
                        setUserToDelete(user)
                        setDeleteUserModal(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        user={selectedUserForEdit}
        onSuccess={fetchUsers}
      />

      <Dialog open={deleteUserModal} onOpenChange={setDeleteUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário "{userToDelete?.full_name}" ({userToDelete?.email})? Esta ação
              não pode ser desfeita e todas as conexões WhatsApp do usuário serão removidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={saving}>
              {saving ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
