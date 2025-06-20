"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users, Key } from "lucide-react"
import { publicApi } from "@/lib/api-client"
import UserModal from "@/components/user-modal"
import ChangePasswordModal from "@/components/change-password-modal"
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
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null)
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any>(null)
  const [deleteUserModal, setDeleteUserModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      console.log("🔍 Buscando usuários via API...")
      setLoading(true)

      const response = await publicApi.getUsers()

      if (response.error) {
        console.error("❌ Erro ao buscar usuários:", response.error)
        setSaveMessage("Erro ao buscar usuários: " + response.error)
        setUsers([])
        return
      }

      if (response.data?.users) {
        console.log("✅ Usuários carregados:", response.data.users.length)
        setUsers(response.data.users)
      }
    } catch (error: any) {
      console.error("💥 Erro ao buscar usuários:", error.message)
      setSaveMessage("Erro ao buscar usuários: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setSaving(true)
    try {
      console.log("🗑️ Deletando usuário:", userToDelete.email)

      const response = await publicApi.deleteUser(userToDelete.id)

      if (response.error) {
        console.error("❌ Erro ao deletar usuário:", response.error)
        setSaveMessage("Erro ao deletar usuário: " + response.error)
        return
      }

      console.log("✅ Usuário deletado com sucesso")
      await fetchUsers()
      setDeleteUserModal(false)
      setUserToDelete(null)
      setSaveMessage("Usuário deletado com sucesso!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error: any) {
      console.error("💥 Erro ao deletar usuário:", error.message)
      setSaveMessage("Erro ao deletar usuário: " + error.message)
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
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              users.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{user.full_name || "Sem nome"}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-xs text-gray-500">
                        Último login: {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Nunca"}
                        {" • "}
                        Limite WhatsApp: {user.whatsapp_connections_limit} conexões
                        {" • "}
                        Logins: {user.login_count || 0}
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
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedUserForEdit(user)
                          setUserModalOpen(true)
                        }}
                        title="Editar usuário"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => {
                          setSelectedUserForPassword(user)
                          setPasswordModalOpen(true)
                        }}
                        title="Alterar senha"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setUserToDelete(user)
                          setDeleteUserModal(true)
                        }}
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        user={selectedUserForEdit}
        onSuccess={fetchUsers}
      />

      <ChangePasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        user={selectedUserForPassword}
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
