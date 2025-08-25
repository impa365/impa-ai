"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Share2, 
  ExternalLink, 
  Plus, 
  QrCode, 
  BarChart3, 
  Settings, 
  Copy, 
  Trash2, 
  Lock, 
  AlertTriangle,
  AlertCircle,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SharedLink {
  id: string;
  connection_id: string;
  connection: {
    id: string;
    connection_name: string;
    instance_name: string;
    status: string;
  };
  token: string;
  has_password: boolean;
  permissions: {
    qr_code: boolean;
    stats: boolean;
    settings: boolean;
  };
  expires_at?: string;
  max_uses?: number;
  current_uses: number;
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
  password_hash?: string; // Adicionado para armazenar o hash da senha
  salt?: string; // Adicionado para armazenar o salt da senha
}

interface WhatsAppConnection {
  id: string;
  connection_name: string;
  instance_name: string;
  status: string;
}

interface CreateLinkForm {
  connection_id: string;
  password: string;
  permissions: {
    qr_code: boolean;
    stats: boolean;
    settings: boolean;
  };
  expires_in_hours?: number;
  max_uses?: number;
}

interface WhatsAppSharedLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: WhatsAppConnection[];
  preSelectedConnection?: WhatsAppConnection; // Nova prop para conexão pré-selecionada
}

export function WhatsAppSharedLinksModal({ isOpen, onClose, connections, preSelectedConnection }: WhatsAppSharedLinksModalProps) {
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("create"); // Mudar padrão para "create"
  const [showPassword, setShowPassword] = useState(true); // Senha visível por padrão
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para visualizar senhas (removido - não é útil)
  // const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  // const [passwords, setPasswords] = useState<{[key: string]: string}>({});
  
  // Estados para edição
  const [editingLink, setEditingLink] = useState<SharedLink | null>(null);
  const [editFormData, setEditFormData] = useState<CreateLinkForm>({
    connection_id: "",
    password: "",
    permissions: {
      qr_code: true,
      stats: false,
      settings: false
    },
    expires_in_hours: undefined,
    max_uses: undefined
  });
  
  // Form state
  const [formData, setFormData] = useState<CreateLinkForm>({
    connection_id: "",
    password: "",
    permissions: {
      qr_code: true,
      stats: false,
      settings: false
    },
    expires_in_hours: undefined,
    max_uses: undefined
  });
  
  // Carregar links compartilhados
  useEffect(() => {
    if (isOpen) {
      loadSharedLinks();
    }
  }, [isOpen]);

  // Pré-selecionar conexão quando especificada
  useEffect(() => {
    if (preSelectedConnection && isOpen) {
      setFormData(prev => ({
        ...prev,
        connection_id: preSelectedConnection.id
      }));
      setActiveTab("create");
    }
  }, [preSelectedConnection, isOpen]);

  const loadSharedLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/whatsapp/shared-links");
      const data = await response.json();

      if (data.success) {
        setSharedLinks(data.data || []);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao carregar links",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar links:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar links compartilhados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSharedLink = async () => {
    try {
      setIsCreating(true);

      // Usar a conexão pré-selecionada ou a do formulário
      const connectionId = preSelectedConnection?.id || formData.connection_id;

      if (!connectionId) {
        toast({
          title: "Erro",
          description: "Selecione uma conexão",
          variant: "destructive",
        });
        return;
      }

      // Criar o payload usando a conexão correta
      const payload = {
        ...formData,
        connection_id: connectionId
      };

      const response = await fetch("/api/whatsapp/shared-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSharedLinks(prev => [data.data, ...prev]);
        
        // Reset form
        setFormData({
          connection_id: preSelectedConnection?.id || "", // Manter pré-seleção se existir
          password: "",
          permissions: {
            qr_code: true,
            stats: false,
            settings: false
          },
          expires_in_hours: undefined,
          max_uses: undefined
        });
        
        setActiveTab("list");
        
        toast({
          title: "Sucesso",
          description: "Link compartilhado criado com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao criar link:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar link compartilhado",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteSharedLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/shared-links?id=${linkId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setSharedLinks(prev => prev.filter(link => link.id !== linkId));
        toast({
          title: "Sucesso",
          description: "Link removido com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao remover link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao deletar link:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover link",
        variant: "destructive",
      });
    }
  };

  const copyShareUrl = async (token: string) => {
    const shareUrl = `${window.location.origin}/shared/whatsapp/${token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "URL copiada",
        description: "Link copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar link",
        variant: "destructive",
      });
    }
  };

  const openSharedLink = (token: string) => {
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/shared/whatsapp/${token}`, '_blank');
  };

  // Função para iniciar edição do link
  const editLink = (link: SharedLink) => {
    setEditingLink(link);
    setEditFormData({
      connection_id: link.connection_id,
      password: "", // Não podemos recuperar a senha original
      permissions: link.permissions,
      expires_in_hours: link.expires_at ? 
        Math.round((new Date(link.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)) : 
        undefined,
      max_uses: link.max_uses || undefined
    });
    setActiveTab("edit");
  };

  // Função para salvar edições
  const saveEditLink = async () => {
    try {
      setIsCreating(true);

      const response = await fetch(`/api/whatsapp/shared-links?id=${editingLink?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar a lista
        setSharedLinks(prev => prev.map(link => 
          link.id === editingLink?.id ? data.data : link
        ));
        
        setActiveTab("list");
        setEditingLink(null);
        
        toast({
          title: "Sucesso",
          description: "Link atualizado com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar link:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar link compartilhado",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: "bg-green-100 text-green-800",
      connecting: "bg-yellow-100 text-yellow-800",
      disconnected: "bg-red-100 text-red-800",
    };
    
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  const getPermissionIcons = (permissions: SharedLink['permissions']) => {
    const icons = [];
    if (permissions.qr_code) icons.push(<QrCode key="qr" className="w-4 h-4" />);
    if (permissions.stats) icons.push(<BarChart3 key="stats" className="w-4 h-4" />);
    if (permissions.settings) icons.push(<Settings key="settings" className="w-4 h-4" />);
    return icons;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Links Compartilhados
            {preSelectedConnection && (
              <span className="text-sm font-normal text-gray-500">
                - {preSelectedConnection.connection_name}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {preSelectedConnection 
              ? `Gerencie links seguros para compartilhar a conexão ${preSelectedConnection.connection_name}`
              : "Gerencie links seguros para compartilhar conexões WhatsApp"
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">
              <ExternalLink className="w-4 h-4 mr-2" />
              Links Ativos ({sharedLinks.length})
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo
            </TabsTrigger>
            <TabsTrigger value="edit" disabled={!editingLink}>
              <Settings className="w-4 h-4 mr-2" />
              Editar
            </TabsTrigger>
          </TabsList>

          {/* Lista de Links */}
          <TabsContent value="list" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Carregando links...</span>
              </div>
            ) : sharedLinks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum link compartilhado
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Crie seu primeiro link para compartilhar conexões WhatsApp
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Link
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Aviso para links órfãos */}
                {sharedLinks.some(link => !link.connection) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Links com conexões removidas</AlertTitle>
                    <AlertDescription>
                      Alguns links não são exibidos porque as conexões WhatsApp foram removidas.
                      {sharedLinks.filter(link => !link.connection).length} link(s) afetado(s).
                    </AlertDescription>
                  </Alert>
                )}
                
                {sharedLinks
                  .filter(link => link.connection) // Filtrar apenas links com conexão válida
                  .map((link) => (
                  <Card key={link.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CardTitle className="text-lg">
                            {link.connection?.connection_name || 'Conexão não encontrada'}
                          </CardTitle>
                          <Badge className={getStatusBadge(link.connection?.status || 'disconnected')}>
                            {link.connection?.status || 'desconhecido'}
                          </Badge>
                          {link.password_hash && (
                            <Badge variant="secondary">
                              <Lock className="w-3 h-3 mr-1" />
                              Protegido
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPermissionIcons(link.permissions)}
                        </div>
                      </div>
                      <CardDescription>
                        Instância: {link.connection?.instance_name || 'N/A'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Informações do Link */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Criado</p>
                          <p className="font-medium">
                            {new Date(link.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Usos</p>
                          <p className="font-medium">
                            {link.current_uses}
                            {link.max_uses && ` / ${link.max_uses}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expira</p>
                          <p className="font-medium">
                            {link.expires_at 
                              ? new Date(link.expires_at).toLocaleDateString()
                              : "Nunca"
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Último Acesso</p>
                          <p className="font-medium">
                            {link.last_accessed_at
                              ? new Date(link.last_accessed_at).toLocaleDateString()
                              : "Nunca"
                            }
                          </p>
                        </div>
                      </div>

                      {/* Permissões */}
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Permissões:</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <QrCode className="w-4 h-4" />
                            <span className={link.permissions.qr_code ? "text-green-600" : "text-gray-400"}>
                              QR Code
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-4 h-4" />
                            <span className={link.permissions.stats ? "text-green-600" : "text-gray-400"}>
                              Stats
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Settings className="w-4 h-4" />
                            <span className={link.permissions.settings ? "text-green-600" : "text-gray-400"}>
                              Config
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Informações da Senha */}
                      {link.password_hash && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Proteção:</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Link protegido por senha
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editLink(link)}
                              className="h-7 text-xs"
                            >
                              <Key className="w-3 h-3 mr-1" />
                              Alterar Senha
                            </Button>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            💡 Use o botão "Editar" para alterar a senha
                          </p>
                        </div>
                      )}

                      {/* Ações */}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyShareUrl(link.token)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSharedLink(link.token)}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editLink(link)}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSharedLink(link.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Criar Novo Link */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {preSelectedConnection 
                    ? `Criar Link para ${preSelectedConnection.connection_name}`
                    : "Criar Link Compartilhado"
                  }
                </CardTitle>
                <CardDescription>
                  {preSelectedConnection 
                    ? `Configure um link seguro para compartilhar a conexão ${preSelectedConnection.connection_name}`
                    : "Configure um link seguro para compartilhar sua conexão WhatsApp"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seleção de Conexão */}
                <div className="space-y-2">
                  <Label htmlFor="connection">Conexão WhatsApp</Label>
                  {preSelectedConnection ? (
                    // Quando há uma conexão pré-selecionada, mostrar apenas ela (readonly)
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{preSelectedConnection.connection_name}</span>
                        <Badge variant="outline">
                          {preSelectedConnection.instance_name}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Conexão selecionada automaticamente
                      </p>
                    </div>
                  ) : (
                    // Quando não há pré-seleção, mostrar o select normal
                    <Select
                      value={formData.connection_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, connection_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conexão WhatsApp" />
                      </SelectTrigger>
                      <SelectContent>
                        {connections?.map((conn) => (
                          <SelectItem key={conn.id} value={conn.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{conn.connection_name}</span>
                              <Badge 
                                variant={conn.status === 'connected' ? 'default' : 'secondary'}
                                className="ml-2"
                              >
                                {conn.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Senha Opcional */}
                <div className="space-y-2">
                  <Label htmlFor="password">Senha (Opcional)</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite uma senha para proteger o link"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {/* Critérios de senha */}
                  {formData.password && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm font-medium text-gray-700 mb-2">Critérios de segurança:</p>
                      <div className="space-y-1 text-xs">
                        <div className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                          {formData.password.length >= 8 ? '✅' : '❌'}
                          <span>Mínimo 8 caracteres</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                          {/[A-Z]/.test(formData.password) ? '✅' : '❌'}
                          <span>Pelo menos uma letra maiúscula</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                          {/[a-z]/.test(formData.password) ? '✅' : '❌'}
                          <span>Pelo menos uma letra minúscula</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                          {/[0-9]/.test(formData.password) ? '✅' : '❌'}
                          <span>Pelo menos um número</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                          {/[^A-Za-z0-9]/.test(formData.password) ? '✅' : '❌'}
                          <span>Pelo menos um símbolo (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Se definida, o cliente precisará informar esta senha para acessar
                  </p>
                </div>

                {/* Permissões */}
                <div className="space-y-4">
                  <Label>Permissões do Cliente</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <QrCode className="w-4 h-4" />
                        <div>
                          <p className="font-medium">QR Code</p>
                          <p className="text-sm text-gray-500">Permitir acesso ao QR Code para conexão</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.permissions.qr_code}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({
                            ...prev,
                            permissions: { ...prev.permissions, qr_code: checked }
                          }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Estatísticas</p>
                          <p className="text-sm text-gray-500">Mostrar contatos, conversas e mensagens</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.permissions.stats}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({
                            ...prev,
                            permissions: { ...prev.permissions, stats: checked }
                          }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Configurações</p>
                          <p className="text-sm text-gray-500">Permitir visualizar e alterar configurações</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.permissions.settings}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({
                            ...prev,
                            permissions: { ...prev.permissions, settings: checked }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Configurações Avançadas */}
                <div className="space-y-4">
                  <Label>Configurações Avançadas</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expires">Expirar após (horas)</Label>
                      <Input
                        id="expires"
                        type="number"
                        placeholder="Ex: 24"
                        value={formData.expires_in_hours || ""}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          expires_in_hours: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                      />
                      <p className="text-sm text-gray-500">
                        Deixe vazio para não expirar
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxUses">Máximo de usos</Label>
                      <Input
                        id="maxUses"
                        type="number"
                        placeholder="Ex: 10"
                        value={formData.max_uses || ""}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          max_uses: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                      />
                      <p className="text-sm text-gray-500">
                        Deixe vazio para uso ilimitado
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alerta sobre Segurança */}
                <Alert>
                  <Lock className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Dica de Segurança:</strong> Links com senha são mais seguros. 
                    Configure permissões específicas e limite o tempo/uso para máxima proteção.
                  </AlertDescription>
                </Alert>

                {/* Botão Criar */}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("list")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={createSharedLink}
                    disabled={isCreating || (!formData.connection_id && !preSelectedConnection)}
                    className="w-full"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Criando...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Criar Link Compartilhado
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Editar Link */}
          <TabsContent value="edit" className="space-y-6">
            {editingLink && (
              <Card>
                <CardHeader>
                  <CardTitle>Editar Link Compartilhado</CardTitle>
                  <CardDescription>
                    Atualize as configurações do link para {editingLink.connection?.connection_name || 'conexão selecionada'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* Conexão (readonly) */}
                    <div className="space-y-2">
                      <Label>Conexão WhatsApp</Label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{editingLink.connection?.connection_name || 'Conexão não encontrada'}</span>
                          <Badge variant="outline">
                            {editingLink.connection?.instance_name || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Nova Senha (Opcional) */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-password">Nova Senha (Opcional)</Label>
                      <div className="relative">
                        <Input
                          id="edit-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite uma nova senha ou deixe vazio para manter a atual"
                          value={editFormData.password}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Deixe vazio para manter a senha atual. Digite uma nova senha para alterá-la.
                      </p>
                    </div>

                    {/* Permissões */}
                    <div className="space-y-4">
                      <Label>Permissões do Cliente</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <QrCode className="w-4 h-4" />
                            <div>
                              <p className="font-medium">QR Code</p>
                              <p className="text-sm text-gray-500">Permitir acesso ao QR Code para conexão</p>
                            </div>
                          </div>
                          <Switch
                            checked={editFormData.permissions.qr_code}
                            onCheckedChange={(checked) => 
                              setEditFormData(prev => ({
                                ...prev,
                                permissions: { ...prev.permissions, qr_code: checked }
                              }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4" />
                            <div>
                              <p className="font-medium">Estatísticas</p>
                              <p className="text-sm text-gray-500">Mostrar contatos, conversas e mensagens</p>
                            </div>
                          </div>
                          <Switch
                            checked={editFormData.permissions.stats}
                            onCheckedChange={(checked) => 
                              setEditFormData(prev => ({
                                ...prev,
                                permissions: { ...prev.permissions, stats: checked }
                              }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Settings className="w-4 h-4" />
                            <div>
                              <p className="font-medium">Configurações</p>
                              <p className="text-sm text-gray-500">Permitir visualizar e alterar configurações</p>
                            </div>
                          </div>
                          <Switch
                            checked={editFormData.permissions.settings}
                            onCheckedChange={(checked) => 
                              setEditFormData(prev => ({
                                ...prev,
                                permissions: { ...prev.permissions, settings: checked }
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Configurações Avançadas */}
                    <div className="space-y-4">
                      <Label>Configurações Avançadas</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-expires">Expirar após (horas)</Label>
                          <Input
                            id="edit-expires"
                            type="number"
                            placeholder="Ex: 24"
                            value={editFormData.expires_in_hours || ""}
                            onChange={(e) => setEditFormData(prev => ({ 
                              ...prev, 
                              expires_in_hours: e.target.value ? parseInt(e.target.value) : undefined 
                            }))}
                          />
                          <p className="text-xs text-gray-500">
                            Deixe vazio para não expirar
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-max-uses">Máximo de usos</Label>
                          <Input
                            id="edit-max-uses"
                            type="number"
                            placeholder="Ex: 10"
                            value={editFormData.max_uses || ""}
                            onChange={(e) => setEditFormData(prev => ({ 
                              ...prev, 
                              max_uses: e.target.value ? parseInt(e.target.value) : undefined 
                            }))}
                          />
                          <p className="text-xs text-gray-500">
                            Deixe vazio para uso ilimitado
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={saveEditLink}
                      disabled={isCreating}
                      className="flex-1"
                    >
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActiveTab("list");
                        setEditingLink(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 