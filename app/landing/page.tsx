"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSystemName } from "@/hooks/use-system-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Bot,
  Smartphone,
  Brain,
  Zap,
  Users,
  MessageSquare,
  Calendar,
  Image,
  Mic,
  Volume2,
  Code,
  BarChart3,
  Shield,
  Clock,
  Globe,
  Star,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Sparkles,
  Rocket,
  Target,
  TrendingUp,
  MessageCircle,
  Settings,
  Lock,
  Layers,
  Database,
  Webhook,
  GitBranch,
  Terminal,
  CloudLightning,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Gauge,
  FileText,
  Hash,
  Key,
  RefreshCw,
  Activity,
  Monitor,
  Server,
  Workflow,
  Timer,
  Filter,
  Headphones,
  Palette,
  Puzzle,
  ChevronDown,
  ExternalLink,
  Github,
  Download,
  BookOpen,
  Coffee,
  DollarSign,
  LineChart,
  PieChart,
  Building,
  Mail,
  Phone,
  MapPin,
  Link2,
  Megaphone,
  Expand,
  X
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { systemName, isLoading } = useSystemName();

  const features = [
    "Sistema de Agentes IA",
    "Integração WhatsApp",
    "Vector Stores",
    "Síntese de Voz",
    "Follow-up Automático",
    "Analytics Avançado"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleDemo = () => {
    router.push("/demo");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/20 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
            <span className="text-2xl font-bold text-white">
              {systemName || "Sistema de IA"}
            </span>
              <div className="text-xs text-blue-300">Plataforma de Agentes Inteligentes</div>
          </div>
          </div>
          <div className="flex items-center gap-4">
          <Button 
            onClick={handleLogin}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          >
            Fazer Login
          </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/20 rounded-full px-6 py-3 mb-8">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Plataforma Enterprise de Agentes IA</span>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">v2.1.0</Badge>
          </div>
          
            <h1 className="text-7xl md:text-9xl font-black text-white mb-8 leading-none">
              {systemName || "Sistema de IA"}
              <div className="text-5xl md:text-7xl bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mt-2">
                Sistema Completo de
                <br />Agentes Inteligentes
              </div>
          </h1>
          
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-6xl mx-auto leading-relaxed">
              Plataforma enterprise para criação e gerenciamento de <strong className="text-blue-400">agentes de IA conversacionais</strong> 
              com integração nativa ao WhatsApp. Arquitetura escalável, APIs robustas e tecnologias de ponta.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Button 
              onClick={handleLogin}
              size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 rounded-xl text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Começar Agora
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleDemo}
                className="border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/70 hover:text-cyan-200 px-12 py-4 rounded-xl text-lg backdrop-blur-sm transition-all duration-300"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
                Ver Demo Live
            </Button>
          </div>

            {/* Animated Feature Showcase */}
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Sistema em Funcionamento</h3>
                <p className="text-gray-400">Funcionalidades ativas em tempo real</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl transition-all duration-500 ${
                      index === activeFeature 
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30' 
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className={`text-sm font-medium transition-colors duration-500 ${
                      index === activeFeature ? 'text-blue-300' : 'text-gray-400'
                    }`}>
                      {feature}
                    </div>
                    {index === activeFeature && (
                      <div className="mt-2 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    )}
              </div>
            ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Arquitetura do Sistema */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-white mb-6">
              Arquitetura <span className="text-blue-400">Enterprise</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Sistema robusto construído com as melhores tecnologias de ponta
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Frontend */}
            <Card className="bg-black/30 backdrop-blur-xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-3">
                  <Monitor className="w-8 h-8 text-blue-400" />
                  Frontend Moderno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 justify-center py-2">Next.js 15</Badge>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 justify-center py-2">React 19</Badge>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 justify-center py-2">TypeScript</Badge>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 justify-center py-2">Tailwind CSS</Badge>
                </div>
                <p className="text-gray-300 text-sm">
                  Interface moderna e responsiva com componentes shadcn/ui, 
                  App Router e Server Components para performance máxima.
                </p>
              </CardContent>
            </Card>

            {/* Backend */}
            <Card className="bg-black/30 backdrop-blur-xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-3">
                  <Server className="w-8 h-8 text-purple-400" />
                  Backend Escalável
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 justify-center py-2">API Routes</Badge>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 justify-center py-2">Serverless</Badge>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 justify-center py-2">JWT Auth</Badge>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 justify-center py-2">REST API</Badge>
                </div>
                <p className="text-gray-300 text-sm">
                  API RESTful completa com autenticação JWT, 
                  middleware de segurança e validação robusta de dados.
                </p>
              </CardContent>
            </Card>

            {/* Database */}
            <Card className="bg-black/30 backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-3">
                  <Database className="w-8 h-8 text-emerald-400" />
                  Banco de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 justify-center py-2">PostgreSQL</Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 justify-center py-2">Supabase</Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 justify-center py-2">RLS</Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 justify-center py-2">Real-time</Badge>
                </div>
                <p className="text-gray-300 text-sm">
                  PostgreSQL com Row Level Security, 
                  triggers automáticos e políticas granulares de acesso.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Funcionalidades Core */}
      <section className="py-24 px-6 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-white mb-6">
              Funcionalidades <span className="text-purple-400">Avançadas</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Sistema completo com recursos enterprise e tecnologias de IA de última geração
            </p>
          </div>

          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-black/30 border border-white/10 p-2 mb-12">
              <TabsTrigger value="agents" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
                Agentes IA
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300">
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="ai" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                IA Avançada
              </TabsTrigger>
              <TabsTrigger value="automation" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                Automação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <Bot className="w-8 h-8 text-blue-400" />
                      Sistema de Agentes Personalizados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Modelos Suportados</span>
                        <Badge className="bg-blue-500/20 text-blue-300">GPT-4, GPT-3.5, Custom</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Personalidades</span>
                        <Badge className="bg-purple-500/20 text-purple-300">Ilimitadas</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Tipos de Trigger</span>
                        <Badge className="bg-green-500/20 text-green-300">Keyword, All, Regex</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Configurações</span>
                        <Badge className="bg-orange-500/20 text-orange-300">Temperature, Tokens, Top-P</Badge>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                      <strong>Recursos Avançados:</strong> Configuração de temperatura, max tokens, 
                      frequency penalty, presence penalty, horários de funcionamento, 
                      mensagens de fallback e muito mais.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <Brain className="w-8 h-8 text-purple-400" />
                      Vector Stores & Conhecimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">ChatNode.ai</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Orimon.ai</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Base Personalizada</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">API Endpoints</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                      <strong>Integração Nativa:</strong> Conecte bases de conhecimento externas, 
                      APIs personalizadas e sistemas de busca semântica para respostas 
                      contextuais precisas.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <Smartphone className="w-8 h-8 text-green-400" />
                      Evolution API Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Múltiplas Instâncias</span>
                        <Badge className="bg-green-500/20 text-green-300">Ilimitadas</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">QR Code Instantâneo</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Status Real-time</span>
                        <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Sincronização Auto</span>
                        <RefreshCw className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                      <strong>Features Técnicas:</strong> Auto-reconexão, webhook events, 
                      configurações de grupos, ignore JIDs, debounce time, 
                      split messages e controle granular.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <Webhook className="w-8 h-8 text-blue-400" />
                      Webhooks & Eventos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <Badge className="bg-white/10 text-gray-300 justify-center py-2">MESSAGE_UPSERT</Badge>
                      <Badge className="bg-white/10 text-gray-300 justify-center py-2">CONNECTION_UPDATE</Badge>
                      <Badge className="bg-white/10 text-gray-300 justify-center py-2">QRCODE_UPDATED</Badge>
                      <Badge className="bg-white/10 text-gray-300 justify-center py-2">CONTACTS_SET</Badge>
                      <Badge className="bg-white/10 text-gray-300 justify-center py-2">CHATS_UPSERT</Badge>
                      <Badge className="bg-white/10 text-gray-300 justify-center py-2">GROUPS_UPDATE</Badge>
                      <Badge className="bg-white/10 text-gray-300 justify-center py-2">SEND_MESSAGE</Badge>
                      <Badge className="bg-white/10 text-gray-300 justify-center py-2">PRESENCE_UPDATE</Badge>
                    </div>
                    <p className="text-gray-400 text-sm">
                      <strong>Eventos Suportados:</strong> Sistema completo de webhooks 
                      para interceptar todos os eventos do WhatsApp em tempo real 
                      com processamento assíncrono.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-8">
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <Volume2 className="w-7 h-7 text-cyan-400" />
                      Síntese de Voz
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">Fish Audio TTS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">ElevenLabs AI</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">OpenAI TTS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">Vozes Clonadas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <Mic className="w-7 h-7 text-blue-400" />
                      Transcrição
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">OpenAI Whisper</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">Multi-idiomas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">Tempo Real</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">Alta Precisão</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <Image className="w-7 h-7 text-purple-400" />
                      Visão IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">GPT-4 Vision</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">Análise Contextual</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">OCR Integrado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">Respostas Visuais</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <Timer className="w-8 h-8 text-purple-400" />
                      Follow-up Diário Automatizado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Sequências Personalizadas</span>
                        <Badge className="bg-purple-500/20 text-purple-300">30 dias</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Mídia Suportada</span>
                        <Badge className="bg-blue-500/20 text-blue-300">Texto, Imagem, Vídeo, Áudio</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Webhook Automático</span>
                        <Badge className="bg-green-500/20 text-green-300">Supabase Cron</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Histórico Completo</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                      <strong>Sistema Avançado:</strong> Controle por instância, agrupamento por conexão,
                      integração com bot padrão, API para gerenciamento de leads 
                      e envio automático via cron jobs.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <Calendar className="w-8 h-8 text-green-400" />
                      Agendamento Inteligente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Cal.com Integration</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Conversação Natural</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Confirmação Auto</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">Lembretes</span>
                        <Badge className="bg-purple-500/20 text-purple-300">Personalizáveis</Badge>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                      <strong>Recursos:</strong> API keys por agente, meeting IDs dinâmicos,
                      horários configuráveis e integração nativa com 
                      calendários externos.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Stack Tecnológica */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-white mb-6">
              Stack <span className="text-cyan-400">Tecnológica</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Tecnologias de ponta para máxima performance, segurança e escalabilidade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Frontend */}
            <Card className="bg-black/30 backdrop-blur-xl border border-blue-500/20 p-6">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Monitor className="w-6 h-6 text-blue-400" />
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Next.js 15</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">React 19</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">TypeScript</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Tailwind CSS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">shadcn/ui</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Backend */}
            <Card className="bg-black/30 backdrop-blur-xl border border-purple-500/20 p-6">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Server className="w-6 h-6 text-purple-400" />
                  Backend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Node.js</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">API Routes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Serverless</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">JWT Auth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">bcrypt</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database */}
            <Card className="bg-black/30 backdrop-blur-xl border border-emerald-500/20 p-6">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-emerald-400" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">PostgreSQL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Supabase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">RLS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Real-time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Triggers</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integrações */}
            <Card className="bg-black/30 backdrop-blur-xl border border-cyan-500/20 p-6">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Puzzle className="w-6 h-6 text-cyan-400" />
                  Integrações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Evolution API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">OpenAI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">n8n</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Cal.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">Chatwoot*</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Integrações Disponíveis */}
      <section className="py-24 px-6 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-white mb-6">
              Integrações <span className="text-green-400">Nativas</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Conecte-se com as melhores ferramentas do mercado para criar o ecossistema perfeito
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Evolution API",
                description: "Integração nativa com WhatsApp Business",
                icon: <Smartphone className="w-12 h-12 text-green-400" />,
                status: "Ativo",
                features: ["Multi-instâncias", "QR Code", "Webhooks", "Status real-time"]
              },
              {
                name: "OpenAI",
                description: "GPT-4, Whisper, TTS e Vision",
                icon: <Brain className="w-12 h-12 text-blue-400" />,
                status: "Ativo",
                features: ["GPT-4o", "Whisper", "TTS", "Vision"]
              },
              {
                name: "Fish Audio",
                description: "TTS de alta qualidade com vozes clonadas",
                icon: <Volume2 className="w-12 h-12 text-cyan-400" />,
                status: "Ativo",
                features: ["Vozes clonadas", "Multi-idiomas", "Alta qualidade", "API nativa"]
              },
              {
                name: "ElevenLabs",
                description: "Síntese de voz premium",
                icon: <Headphones className="w-12 h-12 text-purple-400" />,
                status: "Ativo",
                features: ["Vozes premium", "Clonagem", "Emoções", "Real-time"]
              },
              {
                name: "Cal.com",
                description: "Agendamento automático de compromissos",
                icon: <Calendar className="w-12 h-12 text-cyan-400" />,
                status: "Ativo",
                features: ["Calendário", "Auto-agendamento", "Confirmações", "Lembretes"]
              },
              {
                name: "n8n",
                description: "Automação de workflows",
                icon: <Workflow className="w-12 h-12 text-purple-400" />,
                status: "Ativo",
                features: ["Workflows", "Triggers", "Automação", "Integração"]
              },
              {
                name: "ChatNode.ai",
                description: "Vector store para conhecimento",
                icon: <Brain className="w-12 h-12 text-indigo-400" />,
                status: "Ativo",
                features: ["Vector DB", "Busca semântica", "RAG", "Knowledge base"]
              },
              {
                name: "Orimon.ai",
                description: "Base de conhecimento avançada",
                icon: <Database className="w-12 h-12 text-teal-400" />,
                status: "Ativo",
                features: ["IA conversacional", "Respostas contextuais", "Aprendizado", "Analytics"]
              },
              {
                name: "Chatwoot",
                description: "Plataforma de atendimento omnichannel",
                icon: <MessageCircle className="w-12 h-12 text-blue-400" />,
                status: "Em Breve",
                features: ["Omnichannel", "Chat unificado", "Tickets", "Relatórios"]
              }
            ].map((integration, index) => (
              <Card key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 p-6">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    {integration.icon}
                    <Badge className={`${
                      integration.status === 'Ativo' 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                    }`}>
                      {integration.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-white">
                    {integration.name}
                  </CardTitle>
                  <p className="text-gray-400 text-sm">
                    {integration.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {integration.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow N8N Enterprise */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-white mb-6">
              Workflow <span className="text-cyan-400">Enterprise</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Sistema de automação completo com n8n para workflows avançados de IA conversacional
            </p>
            <Badge className="mt-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30 px-6 py-2 text-lg">
              🚀 Disponível para Clientes Premium
            </Badge>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Imagem do Fluxo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-black/30 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <Activity className="w-4 h-4 mr-1" />
                    Ativo 24/7
                  </Badge>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 cursor-pointer">
                    <Expand className="w-4 h-4 mr-1" />
                    Clique para ampliar
                  </Badge>
                </div>
                <img 
                  src="/images/fluxo-n8n1.png" 
                  alt="Fluxo N8N Enterprise - Workflow de IA Conversacional"
                  className="w-full h-auto rounded-2xl shadow-2xl border border-white/10 cursor-pointer hover:opacity-90 transition-opacity duration-300"
                  onClick={() => setIsImageModalOpen(true)}
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <Workflow className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold">Workflow Completo:</span>
                      <span className="text-cyan-300">WhatsApp → IA → Resposta Automática</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="space-y-8">
              <div>
                <h3 className="text-4xl font-bold text-white mb-6">
                  Automação <span className="text-cyan-400">Inteligente</span>
                </h3>
                <p className="text-xl text-gray-300 leading-relaxed mb-8">
                  Workflow enterprise completo que processa automaticamente mensagens do WhatsApp 
                  através de múltiplas ferramentas de IA, oferecendo respostas contextuais e 
                  ações automatizadas em tempo real.
                </p>
              </div>

              {/* Recursos do Workflow */}
              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-white/5 backdrop-blur-sm border border-cyan-500/20 p-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <Brain className="w-6 h-6 text-cyan-400" />
                      IA Multi-Modal Avançada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-300">Transcrição de Áudio</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-gray-300">Síntese de Voz</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">Análise de Imagens</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-gray-300">Base de Conhecimento</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20 p-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-purple-400" />
                      Automação de Negócios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">Agendamento Cal.com</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">Notificações Auto</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">APIs Personalizadas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">Memória Contextual</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border border-blue-500/20 p-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <Cpu className="w-6 h-6 text-blue-400" />
                      Multi-Modelo IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">OpenAI</Badge>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Anthropic</Badge>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Google</Badge>
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">Ollama</Badge>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Groq</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                  <h4 className="text-lg font-bold text-white">Exclusivo para Clientes</h4>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Este workflow enterprise está disponível <strong className="text-cyan-400">
                  apenas para clientes que adquirem o sistema completo</strong>. 
                  Inclui suporte técnico dedicado, customização de fluxos e 
                  integração com suas ferramentas existentes.
                </p>
                <Button 
                  onClick={handleLogin}
                  className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all duration-300"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Solicitar Acesso
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard & Analytics */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-white mb-6">
              Dashboard <span className="text-blue-400">Enterprise</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Controle total com métricas avançadas, analytics em tempo real e gerenciamento completo
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-white">
                  Controle & Monitoramento
                </h3>
                <p className="text-gray-300 text-lg">
                  Dashboard administrativo completo com métricas em tempo real, 
                  gestão de usuários, análise de performance e controle granular.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                {
                  icon: <Users className="w-6 h-6" />,
                    title: "Gestão de Usuários",
                    description: "Controle total de usuários, permissões e limites"
                  },
                  {
                    icon: <BarChart3 className="w-6 h-6" />,
                    title: "Analytics Avançado",
                    description: "Métricas detalhadas e relatórios personalizados"
                  },
                  {
                    icon: <Key className="w-6 h-6" />,
                    title: "API Keys",
                    description: "Gerenciamento completo de chaves de API"
                  },
                  {
                    icon: <Activity className="w-6 h-6" />,
                    title: "Logs de Atividade",
                    description: "Auditoria completa de todas as ações"
                  }
                ].map((feature, index) => (
                  <div key={index} className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4">
                      {feature.icon}
                  </div>
                    <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
              </div>
            </div>

            <div className="relative">
              <Card className="bg-black/30 backdrop-blur-xl border border-blue-500/20 p-8">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <Gauge className="w-8 h-8 text-blue-400" />
                    Métricas em Tempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Agentes Ativos", value: "1,234", change: "+12%" },
                      { label: "Mensagens/min", value: "856", change: "+8%" },
                      { label: "Conexões", value: "2,156", change: "+15%" },
                      { label: "Uptime", value: "99.9%", change: "Estável" }
                    ].map((metric, index) => (
                      <div key={index} className="p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-white">{metric.value}</div>
                        <div className="text-sm text-gray-400">{metric.label}</div>
                        <div className="text-xs text-green-400">{metric.change}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Performance Overview</h4>
                    <div className="space-y-3">
                      {[
                        { name: "Response Time", value: 85, color: "bg-blue-500" },
                        { name: "Success Rate", value: 98, color: "bg-green-500" },
                        { name: "User Satisfaction", value: 94, color: "bg-purple-500" }
                      ].map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">{item.name}</span>
                            <span className="text-white">{item.value}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className={`${item.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${item.value}%` }}
                            ></div>
                          </div>
                      </div>
                    ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* APIs & Desenvolvimento */}
      <section className="py-24 px-6 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-white mb-6">
              APIs & <span className="text-cyan-400">Desenvolvimento</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              API RESTful completa para integração com seus sistemas existentes
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <Code className="w-8 h-8 text-cyan-400" />
                    REST API Completa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-500/20 text-green-300">GET</Badge>
                        <code className="text-cyan-300">/api/user/agents</code>
                      </div>
                      <p className="text-xs text-gray-400">Listar agentes do usuário</p>
                    </div>
                    <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-500/20 text-blue-300">POST</Badge>
                        <code className="text-cyan-300">/api/agents/webhook</code>
                      </div>
                      <p className="text-xs text-gray-400">Webhook para mensagens</p>
                    </div>
                    <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-500/20 text-orange-300">PUT</Badge>
                        <code className="text-cyan-300">/api/user/agents/[id]</code>
                      </div>
                      <p className="text-xs text-gray-400">Atualizar agente</p>
                    </div>
                </div>
                
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-3">Recursos Disponíveis</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Autenticação JWT</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">API Keys</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Rate Limiting</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Webhooks</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <Terminal className="w-8 h-8 text-green-400" />
                    Exemplo de Integração
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/50 rounded-lg p-6 border border-white/10">
                    <pre className="text-sm text-gray-300 overflow-x-auto">
{`// Criar um novo agente
const response = await fetch('/api/user/agents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Assistente de Vendas',
    training_prompt: 'Você é um especialista...',
    model: 'gpt-4',
    temperature: 0.7,
    whatsapp_connection_id: 'uuid-here'
  })
});

const agent = await response.json();
console.log('Agente criado:', agent);`}
                    </pre>
                </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-3">
                    <Webhook className="w-6 h-6 text-purple-400" />
                    Follow-up API
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300 text-sm">Adicionar Lead</span>
                      <Badge className="bg-green-500/20 text-green-300">POST</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300 text-sm">Atualizar Lead</span>
                      <Badge className="bg-blue-500/20 text-blue-300">PUT</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300 text-sm">Listar Leads</span>
                      <Badge className="bg-purple-500/20 text-purple-300">GET</Badge>
                    </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Segurança & Performance */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-white mb-6">
              Segurança & <span className="text-purple-400">Performance</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Segurança enterprise com criptografia avançada e performance otimizada
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-black/30 backdrop-blur-xl border border-purple-500/20 p-8">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-3">
                  <Shield className="w-8 h-8 text-purple-400" />
                  Segurança Enterprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">JWT Authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">bcrypt Hashing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Row Level Security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">API Rate Limiting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">HTTPS/TLS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Data Encryption</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 backdrop-blur-xl border border-blue-500/20 p-8">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-3">
                  <Zap className="w-8 h-8 text-blue-400" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Server Components</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Edge Computing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Database Indexing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Caching Strategy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">WebSocket Real-time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">CDN Integration</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 backdrop-blur-xl border border-cyan-500/20 p-8">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-3">
                  <CloudLightning className="w-8 h-8 text-cyan-400" />
                  Infraestrutura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Docker Containers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Nginx Proxy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Portainer Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Auto-scaling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Load Balancing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">Health Monitoring</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-24 px-6 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold text-white mb-6">
              Roadmap & <span className="text-purple-400">Futuro</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Desenvolvimento contínuo com novas funcionalidades e integrações
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Chatwoot Integration",
                description: "Plataforma omnichannel completa",
                status: "Em Desenvolvimento",
                timeline: "Q1 2025",
                color: "border-purple-500/30 bg-purple-500/10"
              },
              {
                title: "Multi-tenancy Avançado",
                description: "Isolamento completo por organização",
                status: "Planejado",
                timeline: "Q2 2025",
                color: "border-blue-500/30 bg-blue-500/10"
              },
              {
                title: "IA Voice Agents",
                description: "Agentes completamente por voz",
                status: "Pesquisa",
                timeline: "Q3 2025",
                color: "border-purple-500/30 bg-purple-500/10"
              },
              {
                title: "Mobile Apps",
                description: "Apps nativos iOS e Android",
                status: "Planejado",
                timeline: "Q4 2025",
                color: "border-green-500/30 bg-green-500/10"
              }
            ].map((item, index) => (
              <Card key={index} className={`backdrop-blur-xl border ${item.color} p-6`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Rocket className="w-8 h-8 text-white/70" />
                    <Badge className="bg-white/10 text-white/80">{item.timeline}</Badge>
                  </div>
                  <CardTitle className="text-xl text-white">
                    {item.title}
                  </CardTitle>
                  <p className="text-gray-400 text-sm">
                    {item.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-white/5 text-white/70 border-white/10">
                    {item.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-7xl font-black text-white mb-8">
              Transforme Seu
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Atendimento Hoje
              </span>
          </h2>
            <p className="text-2xl text-gray-300 mb-12 leading-relaxed">
              Junte-se às empresas que já revolucionaram seus resultados com 
              <strong className="text-blue-400"> {systemName || "Sistema de IA"}</strong> - 
              a plataforma enterprise de agentes inteligentes
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              onClick={handleLogin}
              size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-16 py-6 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
                <Rocket className="w-6 h-6 mr-3" />
              Começar Gratuitamente
            </Button>
              <div className="text-blue-100 text-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Setup em 5 minutos</span>
            </div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Suporte técnico 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>API completa incluída</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 pt-12 border-t border-white/10">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">Enterprise</div>
                <div className="text-gray-400">Arquitetura escalável</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">Seguro</div>
                <div className="text-gray-400">Criptografia avançada</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">Rápido</div>
                <div className="text-gray-400">Performance otimizada</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-black/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Bot className="w-7 h-7 text-white" />
              </div>
                <div>
              <span className="text-2xl font-bold text-white">
                {systemName || "Sistema de IA"}
              </span>
                  <div className="text-xs text-blue-300">Enterprise Platform</div>
                </div>
              </div>
              <p className="text-gray-400">
                Plataforma enterprise para criação de agentes inteligentes 
                com integração nativa ao WhatsApp.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Produto</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Funcionalidades</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Integrações</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">API</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Documentação</a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Desenvolvedores</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">API Reference</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Webhooks</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">SDKs</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">GitHub</a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Comunidade</h4>
              <div className="space-y-2">
                <a href="https://projetoimpa.com" className="block text-gray-400 hover:text-white transition-colors">Comunidade IMPA</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Discord</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Telegram</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">YouTube</a>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2024 {systemName || "Sistema de IA"}. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                Desenvolvido pela Comunidade IMPA
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                v2.1.0
              </Badge>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal para ampliar imagem do fluxo N8N */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] bg-black/95 backdrop-blur-xl border border-cyan-500/20 p-0 overflow-hidden">
          <DialogHeader className="absolute top-4 left-6 right-6 z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl text-white flex items-center gap-3">
                <Workflow className="w-8 h-8 text-cyan-400" />
                Workflow Enterprise N8N - Sistema Completo
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsImageModalOpen(false)}
                className="text-white hover:bg-white/10 h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <Activity className="w-4 h-4 mr-1" />
                Ativo 24/7
              </Badge>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                8 Ferramentas Integradas
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                Multi-Modal IA
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                5 Provedores IA
              </Badge>
            </div>
          </DialogHeader>
          
          <div className="relative w-full h-full p-6 pt-24 overflow-auto">
            <img 
              src="/images/fluxo-n8n1.png" 
              alt="Fluxo N8N Enterprise - Workflow de IA Conversacional - Visualização Ampliada"
              className="w-full h-auto rounded-xl shadow-2xl border border-white/10"
            />
            
            <div className="mt-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                Recursos do Workflow Enterprise
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="space-y-2">
                  <h5 className="font-semibold text-cyan-300">IA Multi-Modal</h5>
                  <div className="space-y-1 text-gray-300">
                    <div>• Transcrição de áudio</div>
                    <div>• Análise de imagens</div>
                    <div>• Síntese de voz</div>
                    <div>• Processamento de texto</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-semibold text-purple-300">Automação</h5>
                  <div className="space-y-1 text-gray-300">
                    <div>• Agendamento Cal.com</div>
                    <div>• Notificações automáticas</div>
                    <div>• Webhooks personalizados</div>
                    <div>• APIs de terceiros</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-semibold text-blue-300">Modelos IA</h5>
                  <div className="space-y-1 text-gray-300">
                    <div>• OpenAI (GPT-4)</div>
                    <div>• Anthropic (Claude)</div>
                    <div>• Google (Gemini)</div>
                    <div>• Ollama & Groq</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-semibold text-green-300">Enterprise</h5>
                  <div className="space-y-1 text-gray-300">
                    <div>• Memória contextual</div>
                    <div>• Escalabilidade</div>
                    <div>• Configuração flexível</div>
                    <div>• Suporte 24/7</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 