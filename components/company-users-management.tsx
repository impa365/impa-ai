"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Shield,
  User,
  Eye,
  EyeOff,
  Mail,
  Key,
} from "lucide-react"
import { publicApi } from "@/lib/api-client"

interface CompanyUser {
  id: string
  email: string
  full_name: string
  role: "admin" | "user"
  status: "active" | "inactive" | "suspended"
  permissions: string[]
  created_at: string
  last_login?: string
}

interface CompanyUsersManagementProps {
  companyId: string
  companyName: string
}

const AVAILABLE_PERMISSIONS = [
  { key: "manage_agents", label: "Gerenciar Agentes" },
  { key: "manage_connections", label: "Gerenciar Conexões WhatsApp" },
  { key: "manage_instances", label: "Gerenciar Instâncias" },
  { key: "view_analytics", label: "Visualizar Análises" },
  { key: "manage_settings", label: "Gerenciar Configurações" },
  { key: "manage_users", label: "Gerenciar Usuários" },
]

export default function CompanyUsersManagement({
  companyId,
  companyName,
}: CompanyUsersManagementProps) {
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "user" as "admin" | "user",
    status: "active" as "active" | "inactive" | "suspended",
    permissions: [] as string[],
  })

  useEffect(() => {
    loadUsers()
  }, [companyId])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const result = await publicApi.getCompanyUsers(companyId)

      if (result.error) {
        setMessage(`Erro: ${result.error}`)
        return
      }

      setUsers(result.data || [])
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      setMessage("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user?: CompanyUser) => {
    if (user) {
      setSelectedUser(user)
      setFormData({
        email: user.email,
        full_name: user.full_name,
        password: "",
        role: user.role,
        status: user.status,
        permissions: user.permissions || [],
      })
    } else {
      setSelectedUser(null)
      setFormData({
        email: "",
        full_name: "",
        password: "",
        role: "user",
        status: "active",
        permissions: [],
      })
    }
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.email.trim() || !formData.full_name.trim()) {
      setMessage("Email e nome são obrigatórios")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (!selectedUser && !formData.password) {
      setMessage("Senha é obrigatória para novo usuário")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const payload = {
        ...formData,
        company_id: companyId,
      }

      const result = selectedUser
        ? await publicApi.updateCompanyUser(selectedUser.id, payload)
        : await publicApi.createCompanyUser(payload)

      if (result.error) {
        setMessage(`Erro: ${result.error}`)
        return
      }

      setMessage(
        `Usuário ${selectedUser ? "atualizado" : "criado"} com sucesso!`
      )
      setModalOpen(false)
      loadUsers()
    } catch (error) {
      console.error("Erro ao salvar usuário:", error)
      setMessage("Erro ao salvar usuário")
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    setSaving(true)
    setMessage("")

    try {
      const result = await publicApi.deleteCompanyUser(selectedUser.id)

      if (result.error) {
        setMessage(`Erro: ${result.error}`)
        return
      }

      setMessage("Usuário deletado com sucesso!")
      setDeleteModalOpen(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
      setMessage("Erro ao deletar usuário")
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700"
      case "inactive":
        return "bg-gray-100 text-gray-700"
      case "suspended":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getRoleIcon = (role: string) => {
    return role === "admin" ? (
      <Shield className="w-4 h-4" />
    ) : (
      <User className="w-4 h-4" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Usuários - {companyName}
          </h3>
          <p className="text-gray-600 mt-1">
            Gerencie os usuários e permissões da empresa
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert
          variant={message.includes("sucesso") ? "default" : "destructive"}
        >
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {user.full_name}
                      <Badge variant="outline" className="text-xs">
                        {user.role === "admin" ? "Admin" : "Usuário"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </div>
                    {user.last_login && (
                      <div className="text-xs text-gray-500">
                        Último login:{" "}
                        {new Date(user.last_login).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(user.status)}>
                    {user.status === "active"
                      ? "Ativo"
                      : user.status === "inactive"
                        ? "Inativo"
                        : "Suspenso"}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenModal(user)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          setDeleteModalOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {users.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum usuário cadastrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Adicione o primeiro usuário desta empresa
                </p>
                <Button
                  onClick={() => handleOpenModal()}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Usuário
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? "Atualize as informações e permissões do usuário"
                : "Adicione um novo usuário à empresa"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Nome completo do usuário"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="usuario@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password">
                Senha {selectedUser ? "(deixe vazio para não alterar)" : "*"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Senha do usuário"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Função</Label>
                <select
                  id="role"
                  className="w-full p-2 border rounded-md"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "admin" | "user",
                    })
                  }
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full p-2 border rounded-md"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as
                        | "active"
                        | "inactive"
                        | "suspended",
                    })
                  }
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>
            </div>

            {/* Permissions (only for regular users) */}
            {formData.role === "user" && (
              <div>
                <Label>Permissões</Label>
                <div className="mt-2 space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.key)}
                        onChange={() => togglePermission(permission.key)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{permission.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Admins têm acesso total automaticamente
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o usuário{" "}
              <strong>{selectedUser?.full_name}</strong>? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setSelectedUser(null)
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
