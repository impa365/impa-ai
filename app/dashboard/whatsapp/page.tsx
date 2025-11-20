"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Smartphone,
  Plus,
  Trash2,
  Edit,
  QrCode,
  PowerOff,
  RefreshCw,
  Search,
  Filter,
  Info,
  Loader2,
  Lock,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import WhatsAppConnectionModal from "@/components/whatsapp-connection-modal";
import WhatsAppQRModal from "@/components/whatsapp-qr-modal";
import WhatsAppSettingsModal from "@/components/whatsapp-settings-modal";
import WhatsAppInfoModal from "@/components/whatsapp-info-modal";
import { useToast } from "@/components/ui/use-toast";
import { publicApi } from "@/lib/api-client";

interface WhatsAppConnection {
  id: string;
  connection_name: string;
  instance_name: string;
  phone_number?: string;
  status: "connected" | "connecting" | "disconnected" | "error";
  api_type?: "evolution" | "uazapi";
  created_at: string;
  updated_at?: string;
}

export default function WhatsAppPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Estados para WhatsApp
  const [whatsappConnections, setWhatsappConnections] = useState<
    WhatsAppConnection[]
  >([]);
  const [connectionLimits, setConnectionLimits] = useState({
    current: 0,
    maximum: 2,
    canCreate: true,
  });
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Estados para confirmação de exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<any>(null);

  // Estados para QR Code, configurações e informações
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/");
      return;
    }
    if (currentUser.role === "admin") {
      router.push("/admin/whatsapp");
      return;
    }
    setUser(currentUser);
    checkAccessAndLoadData();
  }, [router]);

  const checkAccessAndLoadData = async () => {
    try {
      const response = await publicApi.getCurrentUser();
      if (response.data?.user) {
        const canAccess = response.data.user.can_access_connections !== false;
        setHasAccess(canAccess);
      }
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar conexões WhatsApp via API
  const fetchWhatsAppConnections = async (showLoading = true) => {
    if (!user) return;

    if (showLoading) {
      setLoadingConnections(true);
    }
    
    try {
      console.log("🔍 Buscando conexões WhatsApp via API...");

      const response = await fetch("/api/whatsapp-connections/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Incluir cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro ao buscar conexões:", errorData);
        toast({
          title: "Erro",
          description: errorData.error || "Erro ao buscar conexões",
          variant: "destructive",
        });
        // Não limpar conexões em caso de erro para evitar piscar
        return;
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Conexões carregadas: ${data.data.connections.length}`);
        setWhatsappConnections(data.data.connections || []);
        setConnectionLimits(data.data.limits);
      } else {
        console.error("❌ Erro na resposta:", data.error);
        toast({
          title: "Erro",
          description: data.error || "Erro ao buscar conexões",
          variant: "destructive",
        });
        // Não limpar conexões em caso de erro para evitar piscar
      }
    } catch (error: any) {
      console.error("💥 Erro ao buscar conexões:", error);
      toast({
        title: "Erro",
        description: "Erro de conexão ao buscar dados",
        variant: "destructive",
      });
      // Não limpar conexões em caso de erro para evitar piscar
    } finally {
      if (showLoading) {
        setLoadingConnections(false);
      }
    }
  };

  // Função para filtrar conexões
  const filteredConnections = whatsappConnections.filter((connection) => {
    const matchesSearch =
      connection.connection_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (connection.phone_number && connection.phone_number.includes(searchTerm));

    const matchesStatus =
      statusFilter === "all" || connection.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Função para sincronizar uma conexão específica
  const syncConnection = useCallback(async (connectionId: string) => {
    try {
      console.log(`🔄 Sincronizando conexão: ${connectionId}`);

      const response = await fetch(`/api/whatsapp/sync/${connectionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Conexão sincronizada:", data);
        await fetchWhatsAppConnections(false);
      } else {
        const errorData = await response.json();
        console.error("❌ Erro ao sincronizar conexão:", errorData);
      }
    } catch (error) {
      console.error("💥 Erro ao sincronizar conexão:", error);
    }
  }, []);

  // Auto-sync silencioso a cada 30 segundos + eventos
  const autoSync = useCallback(async () => {
    try {
      // Sincronizar apenas se a página estiver visível
      if (document.hidden) return;
      
      // Sincronizar apenas se há conexões para sincronizar
      if (whatsappConnections.length === 0) return;
      
      await fetch("/api/whatsapp/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      // Recarregar conexões silenciosamente (sem loading)
      await fetchWhatsAppConnections(false);
    } catch (error) {
      // Silently handle auto-sync errors
    }
  }, [whatsappConnections.length]);

  // Carregar conexões quando usuário estiver disponível
  useEffect(() => {
    if (user) {
      fetchWhatsAppConnections();
    }
  }, [user]);

  // Configurar auto-sync quando usuário estiver disponível
  useEffect(() => {
    if (!user) return;

    // Configurar auto-sync a cada 30 segundos
    const interval = setInterval(() => autoSync(), 30000);

    // Sincronizar quando a página ganhar foco (usuário voltar para a aba)
    const handleFocus = () => autoSync();
    window.addEventListener("focus", handleFocus);

    // Sincronizar quando a página ficar visível
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        autoSync();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, autoSync]);

  const handleDeleteConnection = async (connection: any) => {
    setConnectionToDelete(connection);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteConnection = async () => {
    if (!connectionToDelete) return;

    try {
      console.log("🗑️ Deletando conexão:", {
        connection_name: connectionToDelete.connection_name,
        instance_name: connectionToDelete.instance_name,
        id: connectionToDelete.id
      });

      const response = await fetch(
        `/api/whatsapp/delete-instance/${connectionToDelete.instance_name}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      console.log("📡 Resposta da API:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Conexão deletada:", data);

        // Recarregar lista de conexões
        await fetchWhatsAppConnections(false);
        setDeleteConfirmOpen(false);
        setConnectionToDelete(null);

        toast({
          title: "Sucesso",
          description: data.message || "Conexão excluída com sucesso",
        });
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error("❌ Erro ao fazer parse da resposta:", parseError);
          errorData = { error: `Erro ${response.status}: ${response.statusText}` };
        }
        
        console.error("❌ Erro ao deletar:", {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        
        const errorMessage = errorData?.error || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("💥 Erro ao deletar conexão:", {
        error: error,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
      toast({
        title: "Erro",
        description: (error as Error).message || "Erro ao excluir conexão",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectConnection = async (connection: any) => {
    try {
      console.log(`🔌 Desconectando instância: ${connection.instance_name}`);

      // Atualização otimista - atualizar imediatamente no estado local
      setWhatsappConnections(prev => 
        prev.map(conn => 
          conn.id === connection.id 
            ? { ...conn, status: "disconnected" as const }
            : conn
        )
      );

      const response = await fetch(
        `/api/whatsapp/disconnect/${connection.instance_name}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Instância desconectada:", data);
        // Recarregar para garantir sincronização completa
        await fetchWhatsAppConnections(false);
        toast({
          title: "Sucesso",
          description: "Instância desconectada com sucesso",
        });
      } else {
        const errorData = await response.json();
        console.error("❌ Erro ao desconectar:", errorData);
        // Reverter mudança otimista em caso de erro
        setWhatsappConnections(prev => 
          prev.map(conn => 
            conn.id === connection.id 
              ? { ...conn, status: connection.status }
              : conn
          )
        );
        toast({
          title: "Erro",
          description: errorData.error || "Erro ao desconectar",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Erro ao desconectar:", error);
      // Reverter mudança otimista em caso de erro
      setWhatsappConnections(prev => 
        prev.map(conn => 
          conn.id === connection.id 
            ? { ...conn, status: connection.status }
            : conn
        )
      );
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
    }
  };

  const handleConnectionSuccess = () => {
    fetchWhatsAppConnections(false);
    setShowConnectionModal(false);
  };

  // Sincronização manual baseada na do admin
  const handleManualSync = async () => {
    if (syncing) return;
    
    // Não sincronizar se não há conexões
    if (whatsappConnections.length === 0) {
      toast({
        title: "Informação",
        description: "Nenhuma conexão para sincronizar",
      });
      return;
    }

    setSyncing(true);
    try {
      console.log("🔄 Iniciando sincronização manual...");

      const response = await fetch("/api/whatsapp/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        // Tentar ler como texto se não for JSON válido
        const errorText = await response.text();
        console.error("❌ Erro na sincronização (texto):", errorText);
        toast({
          title: "Erro",
          description: "Erro interno do servidor",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();

      if (data.success) {
        console.log("✅ Sincronização concluída:", data);
        await fetchWhatsAppConnections(false);

        toast({
          title: "Sucesso",
          description:
            data.message || `${data.syncedCount || 0} conexões sincronizadas`,
        });
      } else {
        console.error("❌ Erro na sincronização:", data.error);
        toast({
          title: "Erro",
          description: data.error || "Erro na sincronização",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("💥 Erro na sincronização manual:", error);
      toast({
        title: "Erro",
        description: "Erro de conexão durante sincronização",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  // Quando o modal QR é aberto, sincronizar a conexão selecionada
  useEffect(() => {
    if (qrModalOpen && selectedConnection) {
      syncConnection(selectedConnection.id);
    }
  }, [qrModalOpen, selectedConnection, syncConnection]);

  // Quando o modal de configurações é aberto, sincronizar a conexão selecionada
  useEffect(() => {
    if (settingsModalOpen && selectedConnection) {
      syncConnection(selectedConnection.id);
    }
  }, [settingsModalOpen, selectedConnection, syncConnection]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
          <Lock className="h-5 w-5" />
          <AlertDescription className="ml-2">
            <div className="font-semibold mb-2">Acesso Negado</div>
            <p>Você não tem permissão para acessar a funcionalidade de Conexões WhatsApp. Entre em contato com um administrador para solicitar acesso.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Conexões WhatsApp
          </h1>
          <p className="text-gray-600">
            Gerencie suas conexões do WhatsApp Business
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {connectionLimits.current} de {connectionLimits.maximum} conexões
            utilizadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManualSync}
            disabled={syncing}
            className="gap-2 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Sincronizar status das conexões"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
          <Button
            onClick={() => setShowConnectionModal(true)}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            disabled={!connectionLimits.canCreate || loadingConnections}
          >
            <Plus className="w-4 h-4" />
            Nova Conexão
          </Button>
        </div>
      </div>

      {/* Alerta de limite */}
      {!connectionLimits.canCreate && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Info className="w-4 h-4" />
              <span className="font-medium">
                Limite atingido: Você atingiu o limite máximo de{" "}
                {connectionLimits.maximum} conexões.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Filtros
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome da conexão ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="connected">Conectado</SelectItem>
                  <SelectItem value="connecting">Conectando</SelectItem>
                  <SelectItem value="disconnected">Desconectado</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Mostrando {filteredConnections.length} de{" "}
            {whatsappConnections.length} conexões
            {searchTerm && <span> • Busca: "{searchTerm}"</span>}
            {statusFilter !== "all" && <span> • Status: {statusFilter}</span>}
            {syncing && (
              <span className="ml-2 text-blue-600">
                • Sincronizando status...
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {loadingConnections ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Carregando conexões...</p>
          </CardContent>
        </Card>
      ) : filteredConnections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="w-16 h-16 text-gray-300 mb-4" />
            {whatsappConnections.length === 0 ? (
              <>
                <h4 className="text-lg font-medium mb-2">
                  Nenhuma conexão WhatsApp
                </h4>
                <p className="text-gray-600 text-center mb-6">
                  Conecte seu WhatsApp para começar a usar os agentes de IA
                </p>
                <Button
                  onClick={() => setShowConnectionModal(true)}
                  className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  disabled={!connectionLimits.canCreate}
                >
                  <Plus className="w-4 h-4" />
                  Primeira Conexão
                </Button>
              </>
            ) : (
              <>
                <h4 className="text-lg font-medium mb-2">
                  Nenhuma conexão encontrada
                </h4>
                <p className="text-gray-600 text-center mb-6">
                  Nenhuma conexão corresponde aos filtros aplicados
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredConnections.map((connection) => (
            <Card key={connection.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {connection.connection_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {connection.status === "connected"
                          ? connection.phone_number || "Conectado"
                          : connection.status === "connecting"
                          ? "Conectando..."
                          : "Desconectado"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Criado em{" "}
                        {new Date(connection.created_at).toLocaleDateString()}
                        {connection.updated_at && (
                          <span className="ml-2">
                            • Atualizado:{" "}
                            {new Date(
                              connection.updated_at
                            ).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Tag da API */}
                    <Badge
                      variant="outline"
                      className={
                        connection.api_type === "uazapi"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }
                    >
                      {connection.api_type === "uazapi" ? "Uazapi" : "Evolution API"}
                    </Badge>
                    
                    {/* Status Badge */}
                    <Badge
                      variant={
                        connection.status === "connected"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        connection.status === "connected"
                          ? "bg-green-100 text-green-700"
                          : connection.status === "connecting"
                          ? "bg-yellow-100 text-yellow-700"
                          : connection.status === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {connection.status === "connected"
                        ? "Conectado"
                        : connection.status === "connecting"
                        ? "Conectando"
                        : connection.status === "error"
                        ? "Erro"
                        : "Desconectado"}
                    </Badge>
                    <div className="flex gap-1">
                      {connection.status === "connected" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedConnection(connection);
                            setInfoModalOpen(true);
                          }}
                          disabled={connection.api_type === "uazapi"}
                          title={
                            connection.api_type === "uazapi"
                              ? "Em breve para Uazapi"
                              : "Ver Informações"
                          }
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedConnection(connection);
                            setQrModalOpen(true);
                          }}
                          title="Conectar/Ver QR Code"
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedConnection(connection);
                          setSettingsModalOpen(true);
                        }}
                        disabled={connection.api_type === "uazapi"}
                        title={
                          connection.api_type === "uazapi"
                            ? "Em breve para Uazapi"
                            : "Configurações"
                        }
                        className="border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {(connection.status === "connected" ||
                        connection.status === "connecting") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectConnection(connection)}
                          title="Desconectar"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <PowerOff className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConnection(connection)}
                        title="Excluir"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modais */}
      <WhatsAppConnectionModal
        open={showConnectionModal}
        onOpenChange={setShowConnectionModal}
        userId={user?.id}
        onSuccess={handleConnectionSuccess}
      />

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conexão "
              {connectionToDelete?.connection_name}"? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteConnection}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modais */}
      <WhatsAppQRModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        connection={selectedConnection}
        onStatusChange={(status) => {
          if (selectedConnection) {
            // Recarregar conexões após mudança de status
            fetchWhatsAppConnections();
          }
        }}
      />

      <WhatsAppSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        connection={selectedConnection}
        onSettingsSaved={() => {
          console.log("Configurações salvas!");
        }}
      />

      <WhatsAppInfoModal
        open={infoModalOpen}
        onOpenChange={setInfoModalOpen}
        connection={selectedConnection}
      />
    </div>
  );
}
