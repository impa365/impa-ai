"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Users,
  Search,
  Building2,
  Mail,
  Calendar,
  Filter,
  Shield,
  User,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"

interface UserWithCompany {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  company_id?: string
  company_name?: string
  created_at: string
  last_login_at?: string
}

export default function UsuariosPage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<UserWithCompany[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    if (currentUser.role !== "super_admin") {
      router.push("/dashboard")
      return
    }
    setUser(currentUser)
    loadUsers()
  }, [router])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, roleFilter, statusFilter, users])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/users")
      const data = await response.json()
      
      if (data.error) {
        console.error(data.error)
        return
      }
      
      setUsers(data.users || [])
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por role
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter)
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => u.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Shield className="w-4 h-4 text-purple-600" />
      case "admin":
        return <Shield className="w-4 h-4 text-blue-600" />
      default:
        return <User className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-100 text-purple-700">Super Admin</Badge>
      case "admin":
        return <Badge className="bg-blue-100 text-blue-700">Admin</Badge>
      default:
        return <Badge variant="outline">Usuário</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Ativo</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inativo</Badge>
      case "suspended":
        return <Badge className="bg-red-100 text-red-700">Suspenso</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Todos os Usuários
          </h1>
          <p className="text-gray-600">
            Visualize e gerencie todos os usuários do sistema
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Super Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter((u) => u.role === "super_admin").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter((u) => u.role === "admin").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Usuários Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.status === "active").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, email ou empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <select
                  className="w-full p-2 border rounded-md"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">Todas as Funções</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="user">Usuário</option>
                </select>
              </div>

              <div>
                <select
                  className="w-full p-2 border rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Usuários ({filteredUsers.length} de {users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      {getRoleIcon(u.role)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{u.full_name || "Sem nome"}</span>
                        {getRoleBadge(u.role)}
                        {getStatusBadge(u.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </div>
                        {u.company_name && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {u.company_name}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {u.last_login_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          Último login: {new Date(u.last_login_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/super-admin/usuarios/${u.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum usuário encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros de busca
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
