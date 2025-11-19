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
  Building2,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Users,
  Smartphone,
  Bot,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { publicApi } from "@/lib/api-client"

interface Company {
  id: string
  name: string
  status: "active" | "inactive" | "suspended"
  max_users: number
  max_instances: number
  max_connections: number
  max_agents: number
  created_at: string
  updated_at: string
  stats?: {
    total_users: number
    total_connections: number
    total_instances: number
    total_agents: number
    active_connections: number
    active_agents: number
  }
}

interface CompanyManagementPanelProps {
  onCompanyUpdate?: () => void
}

export default function CompanyManagementPanel({
  onCompanyUpdate,
}: CompanyManagementPanelProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    max_users: 10,
    max_instances: 5,
    max_connections: 10,
    max_agents: 20,
    status: "active" as "active" | "inactive" | "suspended",
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const result = await publicApi.getCompanies()

      if (result.error) {
        setMessage(`Erro: ${result.error}`)
        return
      }

      setCompanies(result.data?.companies || [])
    } catch (error) {
      console.error("Erro ao carregar empresas:", error)
      setMessage("Erro ao carregar empresas")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setSelectedCompany(company)
      setFormData({
        name: company.name,
        max_users: company.max_users,
        max_instances: company.max_instances,
        max_connections: company.max_connections,
        max_agents: company.max_agents,
        status: company.status,
      })
    } else {
      setSelectedCompany(null)
      setFormData({
        name: "",
        max_users: 10,
        max_instances: 5,
        max_connections: 10,
        max_agents: 20,
        status: "active",
      })
    }
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setMessage("Nome da empresa é obrigatório")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    setSaving(true)
    setMessage("")

    try {
      const result = selectedCompany
        ? await publicApi.updateCompany(selectedCompany.id, formData)
        : await publicApi.createCompany(formData)

      if (result.error) {
        setMessage(`Erro: ${result.error}`)
        return
      }

      setMessage(
        `Empresa ${selectedCompany ? "atualizada" : "criada"} com sucesso!`
      )
      setModalOpen(false)
      loadCompanies()
      onCompanyUpdate?.()
    } catch (error) {
      console.error("Erro ao salvar empresa:", error)
      setMessage("Erro ao salvar empresa")
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleDelete = async () => {
    if (!selectedCompany) return

    setSaving(true)
    setMessage("")

    try {
      const result = await publicApi.deleteCompany(selectedCompany.id)

      if (result.error) {
        setMessage(`Erro: ${result.error}`)
        return
      }

      setMessage("Empresa deletada com sucesso!")
      setDeleteModalOpen(false)
      setSelectedCompany(null)
      loadCompanies()
      onCompanyUpdate?.()
    } catch (error) {
      console.error("Erro ao deletar empresa:", error)
      setMessage("Erro ao deletar empresa")
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(""), 3000)
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />
      case "inactive":
        return <Clock className="w-4 h-4" />
      case "suspended":
        return <XCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa"
      case "inactive":
        return "Inativa"
      case "suspended":
        return "Suspensa"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando empresas...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gerenciamento de Empresas
          </h2>
          <p className="text-gray-600 mt-1">
            Gerencie empresas, limites e recursos
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
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

      {/* Companies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  <Badge
                    className={`${getStatusColor(company.status)} mt-1 gap-1`}
                  >
                    {getStatusIcon(company.status)}
                    {getStatusLabel(company.status)}
                  </Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenModal(company)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCompany(company)
                      setDeleteModalOpen(true)
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {/* Limits */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Usuários</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {company.stats?.total_users || 0} / {company.max_users}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Conexões</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {company.stats?.total_connections || 0} /{" "}
                    {company.max_connections}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Instâncias</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {company.stats?.total_instances || 0} /{" "}
                    {company.max_instances}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Agentes</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {company.stats?.total_agents || 0} / {company.max_agents}
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="pt-3 border-t text-xs text-gray-500">
                Criada em {new Date(company.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {companies.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma empresa cadastrada
            </h3>
            <p className="text-gray-600 mb-4">
              Comece criando sua primeira empresa
            </p>
            <Button
              onClick={() => handleOpenModal()}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Criar Primeira Empresa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? "Editar Empresa" : "Nova Empresa"}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? "Atualize as informações e limites da empresa"
                : "Configure a nova empresa e defina os limites de recursos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome da empresa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxUsers">Máx. Usuários</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  value={formData.max_users}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_users: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxInstances">Máx. Instâncias</Label>
                <Input
                  id="maxInstances"
                  type="number"
                  min="1"
                  value={formData.max_instances}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_instances: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxConnections">Máx. Conexões</Label>
                <Input
                  id="maxConnections"
                  type="number"
                  min="1"
                  value={formData.max_connections}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_connections: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxAgents">Máx. Agentes</Label>
                <Input
                  id="maxAgents"
                  type="number"
                  min="1"
                  value={formData.max_agents}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_agents: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
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
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
                <option value="suspended">Suspensa</option>
              </select>
            </div>
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
              Tem certeza que deseja deletar a empresa{" "}
              <strong>{selectedCompany?.name}</strong>? Esta ação não pode ser
              desfeita e todos os dados relacionados serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setSelectedCompany(null)
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
