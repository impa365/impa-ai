"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrCode, WifiOff, Users, MessageCircle, BarChart3, Settings, RefreshCw, Info, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LinkInfo {
  connection: {
    name: string;
    instance_name: string;
    status: string;
    phone_number?: string;
  };
  permissions: {
    qr_code: boolean;
    stats: boolean;
    settings: boolean;
  };
  requires_password: boolean;
  expires_at?: string;
  usage: {
    current: number;
    max?: number;
  };
}

interface ConnectionData extends LinkInfo {
  qr_code?: string;
  stats?: {
    contacts: number;
    chats: number;
    messages: number;
  };
  settings?: any;
}

export default function SharedWhatsAppPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionData, setConnectionData] = useState<ConnectionData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [qrTimer, setQrTimer] = useState(0);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('qr'); // Default to QR Code tab

  // Timer para QR Code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAuthenticated && connectionData?.qr_code && qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, connectionData?.qr_code, qrTimer]);

  // Carregar informações do link (APENAS UMA VEZ)
  useEffect(() => {
    const fetchConnectionData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados iniciais do link
        const response = await fetch(`/api/whatsapp/shared-links/access/${token}`);
        const data = await response.json();
        
        if (data.success) {
          setConnectionData(data.data);
          
          // Se tem permissão para QR Code e não está conectado, gerar automaticamente
          // IMPORTANTE: Só gerar se não requer senha E não tem QR Code ainda
          if (data.data.permissions.qr_code && 
              data.data.connection?.status !== 'connected' && 
              data.data.connection?.status !== 'open' &&
              !data.data.requires_password &&
              !data.data.qr_code) { // ← NOVO: Só gerar se não tem QR Code ainda
            
            console.log("🔄 Auto-gerando QR Code...");
            
            // Tentar gerar QR Code automaticamente
            try {
              const qrResponse = await fetch(`/api/whatsapp/shared-links/qr-code/${token}`, {
                method: "POST",
              });
              
              const qrData = await qrResponse.json();
              
              if (qrData.success) {
                setConnectionData(prev => ({
                  ...prev!,
                  qr_code: qrData.data.qr_code,
                  connection: {
                    ...prev!.connection,
                    status: qrData.data.status || 'connecting'
                  }
                }));
                setQrTimer(40);
                console.log("✅ QR Code gerado automaticamente");
              } else if (qrData.code === 'ALREADY_CONNECTED') {
                // Se já conectou, atualizar status
                setConnectionData(prev => ({
                  ...prev!,
                  connection: {
                    ...prev!.connection,
                    status: 'connected'
                  }
                }));
                console.log("✅ Instância já conectada");
              } else if (qrData.code === 'RATE_LIMITED') {
                console.log("⚠️ Rate limit atingido - não tentando novamente");
              }
            } catch (qrError) {
              console.log("⚠️ Erro ao gerar QR Code automaticamente:", qrError);
            }
          } else if (data.data.requires_password) {
            console.log("🔐 Link protegido por senha - QR Code será gerado após autenticação");
          } else if (data.data.qr_code) {
            console.log("ℹ️ QR Code já existe - não gerando novamente");
          }
        } else {
          setError(data.error || "Erro ao carregar dados");
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setError("Erro ao conectar com o servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchConnectionData();
  }, [token]); // ← CORRIGIDO: Removido qrTimer das dependências

  // Timer separado para QR Code (não recarrega página)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (qrTimer > 0) {
      timer = setInterval(() => {
        setQrTimer((prev) => prev > 0 ? prev - 1 : 0);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [qrTimer]);

  // Função para gerar QR Code
  const generateQRCode = async () => {
    try {
      setIsGeneratingQR(true);
      setQrError(null);
      
      const response = await fetch(`/api/whatsapp/shared-links/qr-code/${token}`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConnectionData(prev => ({
          ...prev!,
          qr_code: data.data.qr_code,
          connection: {
            ...prev!.connection,
            status: data.data.status || 'connecting'
          }
        }));
        setQrTimer(40);
        toast({
          title: "QR Code gerado",
          description: "Escaneie o código com seu WhatsApp",
        });
      } else {
        setQrError(data.error || "Erro ao gerar QR Code");
        toast({
          title: "Erro",
          description: data.error || "Erro ao gerar QR Code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      setQrError("Erro ao conectar com o servidor");
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Função para desconectar instância
  const disconnectInstance = async () => {
    try {
      setIsDisconnecting(true);
      
      const response = await fetch(`/api/whatsapp/shared-links/disconnect/${token}`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConnectionData(prev => ({
          ...prev!,
          connection: {
            ...prev!.connection,
            status: 'disconnected'
          },
          qr_code: undefined // Limpar QR Code
        }));
        setQrTimer(0);
        toast({
          title: "Desconectado",
          description: "Instância WhatsApp desconectada com sucesso",
        });
      } else {
        toast({
          title: "Erro ao desconectar",
          description: data.error || "Erro ao desconectar instância",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const authenticateAccess = async (inputPassword?: string) => {
    try {
      setIsAuthenticating(true);
      
      const response = await fetch(`/api/whatsapp/shared-links/access/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          password: inputPassword || password 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConnectionData(data.data);
        setIsAuthenticated(true);
        
        // Se tem permissão para QR Code e não está conectado, gerar automaticamente após autenticação
        if (data.data.permissions.qr_code && 
            data.data.connection?.status !== 'connected' && 
            data.data.connection?.status !== 'open') {
          
          console.log("🔐 Autenticado com sucesso - Gerando QR Code...");
          
          try {
            const qrResponse = await fetch(`/api/whatsapp/shared-links/qr-code/${token}`, {
              method: "POST",
            });
            
            const qrData = await qrResponse.json();
            
            if (qrData.success) {
              setConnectionData(prev => ({
                ...prev!,
                qr_code: qrData.data.qr_code,
                connection: {
                  ...prev!.connection,
                  status: qrData.data.status || 'connecting'
                }
              }));
              setQrTimer(40);
              console.log("✅ QR Code gerado após autenticação");
            }
          } catch (qrError) {
            console.log("⚠️ Erro ao gerar QR Code após autenticação:", qrError);
          }
        }
        
        toast({
          title: "Acesso autorizado",
          description: "Bem-vindo ao painel WhatsApp!",
        });
      } else {
        setError(data.error || "Senha incorreta");
        toast({
          title: "Erro de autenticação",
          description: data.error || "Senha incorreta",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao autenticar:", error);
      setError("Erro ao autenticar acesso");
      toast({
        title: "Erro",
        description: "Erro ao verificar credenciais",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Digite a senha");
      return;
    }
    authenticateAccess(password);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-green-500";
      case "connecting": return "bg-yellow-500";
      case "disconnected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected": return "Conectado";
      case "connecting": return "Conectando";
      case "disconnected": return "Desconectado";
      default: return "Desconhecido";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <QrCode className="w-4 h-4" />;
      case "connecting": return <RefreshCw className="w-4 h-4" />;
      case "disconnected": return <WifiOff className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Carregando dados da conexão...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !connectionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro de Acesso</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated && connectionData?.requires_password) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Acesso Protegido</CardTitle>
            <CardDescription>
              Esta conexão requer uma senha para acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isAuthenticating}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isAuthenticating}
              >
                {isAuthenticating ? "Verificando..." : "Acessar"}
              </Button>
            </form>

            {/* This section was removed as per the new_code, as it was not in the new_code */}
            {/* {linkInfo && (
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Conexão:</span>
                  <span className="font-medium">{linkInfo.connection.name}</span>
                </div>
                {linkInfo.expires_at && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Expira em:</span>
                    <span>{new Date(linkInfo.expires_at).toLocaleString()}</span>
                  </div>
                )}
                {linkInfo.usage.max && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Usos:</span>
                    <span>{linkInfo.usage.current}/{linkInfo.usage.max}</span>
                  </div>
                )}
              </div>
            )} */}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!connectionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados da conexão...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Painel WhatsApp</CardTitle>
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-sm">
                {connectionData.connection?.instance_name || 'WhatsApp'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {/* Navigation Tabs - only show allowed sections */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {connectionData.permissions.qr_code && (
                  <button
                    onClick={() => setActiveTab('qr')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeTab === 'qr'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <QrCode className="h-4 w-4 inline mr-2" />
                    QR Code
                  </button>
                )}
                
                {connectionData.permissions.stats && (
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeTab === 'stats'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Estatísticas
                  </button>
                )}
                
                {connectionData.permissions.settings && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeTab === 'settings'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Settings className="h-4 w-4 inline mr-2" />
                    Configurações
                  </button>
                )}
              </div>
            </div>

            {/* QR Code Tab */}
            {activeTab === 'qr' && connectionData.permissions.qr_code && (
              <div className="space-y-6">
                {/* Instance Info */}
                <div className="text-center space-y-4">
                  {/* Profile Image */}
                  {(connectionData.connection as any)?.profile_pic_url && (
                    <div className="flex justify-center">
                      <img
                        src={(connectionData.connection as any).profile_pic_url}
                        alt="Foto de perfil"
                        className="w-20 h-20 rounded-full border-4 border-green-500"
                      />
                    </div>
                  )}
                  
                  {/* Instance Name and Status */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {(connectionData.connection as any)?.profile_name || connectionData.connection?.instance_name || 'WhatsApp'}
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        connectionData.connection?.status === 'connected' || connectionData.connection?.status === 'open' 
                          ? 'bg-green-500' 
                          : connectionData.connection?.status === 'connecting' 
                          ? 'bg-yellow-500 animate-pulse' 
                          : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium">
                        {connectionData.connection?.status === 'connected' || connectionData.connection?.status === 'open' 
                          ? 'Conectado' 
                          : connectionData.connection?.status === 'connecting' 
                          ? 'Conectando...' 
                          : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code Display */}
                {connectionData.qr_code && (
                  <div className="text-center space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-inner max-w-sm mx-auto">
                      <img
                        src={connectionData.qr_code}
                        alt="QR Code WhatsApp"
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Escaneie o QR Code com seu WhatsApp
                      </p>
                      {qrTimer > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">
                            Expira em {qrTimer} segundos
                          </p>
                          <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${(qrTimer / 40) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  {/* Generate QR Button - show when disconnected or if QR expired */}
                  {(!connectionData.connection?.status || 
                    connectionData.connection?.status === 'disconnected' || 
                    connectionData.connection?.status === 'closed' ||
                    (connectionData.connection?.status === 'connecting' && !connectionData.qr_code)) && (
                    <Button
                      onClick={generateQRCode}
                      disabled={isGeneratingQR}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      {isGeneratingQR ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Gerando...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4" />
                          Conectar
                        </>
                      )}
                    </Button>
                  )}

                  {/* Refresh QR Button - show when connecting and QR exists */}
                  {connectionData.connection?.status === 'connecting' && connectionData.qr_code && (
                    <Button
                      onClick={generateQRCode}
                      disabled={isGeneratingQR}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {isGeneratingQR ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          Gerando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Atualizar QR
                        </>
                      )}
                    </Button>
                  )}

                  {/* Disconnect Button - show when connected or connecting */}
                  {(connectionData.connection?.status === 'connected' || 
                    connectionData.connection?.status === 'open' ||
                    connectionData.connection?.status === 'connecting') && (
                    <Button
                      onClick={disconnectInstance}
                      disabled={isDisconnecting}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      {isDisconnecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Desconectando...
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4" />
                          Desconectar
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Connection Instructions - only show when needed */}
                {(!connectionData.connection?.status || 
                  connectionData.connection?.status === 'disconnected' || 
                  connectionData.connection?.status === 'connecting') && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Como conectar seu WhatsApp</AlertTitle>
                    <AlertDescription>
                      <ol className="list-decimal list-inside space-y-1 mt-2">
                        <li>Abra o WhatsApp no seu celular</li>
                        <li>Vá em <strong>Configurações → Aparelhos conectados</strong></li>
                        <li>Toque em <strong>"Parear dispositivo"</strong></li>
                        <li>Aponte a câmera para o QR Code acima</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && connectionData.permissions.stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Estatísticas
                  </CardTitle>
                  <CardDescription>
                    Dados da sua conexão WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connectionData.stats ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-blue-50 rounded-lg">
                        <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                          {connectionData.stats.contacts}
                        </div>
                        <div className="text-sm text-gray-600">Contatos</div>
                      </div>
                      
                      <div className="text-center p-6 bg-green-50 rounded-lg">
                        <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {connectionData.stats.chats}
                        </div>
                        <div className="text-sm text-gray-600">Conversas</div>
                      </div>
                      
                      <div className="text-center p-6 bg-purple-50 rounded-lg">
                        <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-600">
                          {connectionData.stats.messages}
                        </div>
                        <div className="text-sm text-gray-600">Mensagens</div>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        Estatísticas não disponíveis no momento.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && connectionData.permissions.settings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Configurações
                  </CardTitle>
                  <CardDescription>
                    Configurações da conexão WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connectionData.settings ? (
                    <div className="space-y-4">
                      <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                        {JSON.stringify(connectionData.settings, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        Configurações não disponíveis.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Conexão compartilhada de forma segura</p>
          {/* This section was removed as per the new_code, as it was not in the new_code */}
          {/* {linkInfo?.expires_at && (
            <p>
              Expira em: {new Date(linkInfo.expires_at).toLocaleString()}
            </p>
          )} */}
        </div>
      </div>
    </div>
  );
} 