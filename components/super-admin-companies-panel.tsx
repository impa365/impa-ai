'use client';

// ================================================
// Componente: Painel de Gerenciamento de Empresas
// Para uso do Super Admin
// ================================================

import { useState, useEffect } from 'react';
import { 
  Company, 
  CompanyStats, 
  SuperAdminDashboard 
} from '@/types/company';
import { 
  Building2, 
  Users, 
  Bot, 
  MessageSquare, 
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export default function SuperAdminCompaniesPanel() {
  const [dashboard, setDashboard] = useState<SuperAdminDashboard | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadCompanies();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/super-admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/companies?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'suspended':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'trial':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      trial: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciamento de Empresas
          </h1>
          <p className="text-gray-600">
            Painel de controle para Super Administradores
          </p>
        </div>

        {/* Stats Cards */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Empresas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard.companies_stats?.total_companies || 0}
                  </p>
                </div>
                <Building2 className="w-12 h-12 text-blue-500 opacity-75" />
              </div>
              <div className="mt-4 flex gap-4 text-xs">
                <span className="text-green-600">
                  {dashboard.companies_stats?.active_companies || 0} ativas
                </span>
                <span className="text-yellow-600">
                  {dashboard.companies_stats?.trial_companies || 0} trial
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Usuários</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard.global_stats?.total_users || 0}
                  </p>
                </div>
                <Users className="w-12 h-12 text-green-500 opacity-75" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Agentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard.global_stats?.total_agents || 0}
                  </p>
                </div>
                <Bot className="w-12 h-12 text-purple-500 opacity-75" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Conexões</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard.global_stats?.total_connections || 0}
                  </p>
                </div>
                <MessageSquare className="w-12 h-12 text-orange-500 opacity-75" />
              </div>
            </div>
          </div>
        )}

        {/* Alertas de Recursos Críticos */}
        {dashboard && dashboard.critical_resources && dashboard.critical_resources.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                  Empresas com recursos acima de 90% do limite
                </h3>
                <div className="space-y-1">
                  {dashboard.critical_resources.slice(0, 3).map((item: any) => (
                    <p key={item.company_id} className="text-sm text-yellow-700">
                      <span className="font-medium">{item.company_name}</span> - 
                      {item.users_usage_percent >= 90 && ` Usuários: ${item.users_usage_percent}%`}
                      {item.agents_usage_percent >= 90 && ` Agentes: ${item.agents_usage_percent}%`}
                      {item.connections_usage_percent >= 90 && ` Conexões: ${item.connections_usage_percent}%`}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspenso</option>
              <option value="inactive">Inativo</option>
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Empresa
            </button>
          </div>
        </div>

        {/* Lista de Empresas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recursos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {company.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {company.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(company.status)}
                      {getStatusBadge(company.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">
                      {company.subscription_plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-4">
                      <span>👥 {company.max_users}</span>
                      <span>🤖 {company.max_agents}</span>
                      <span>📱 {company.max_connections}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
