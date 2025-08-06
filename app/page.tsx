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
import { getCurrentUser } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState(0);
  const [isLandingPageEnabled, setIsLandingPageEnabled] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const { systemName, isLoading } = useSystemName();

  const features = [
    "Sistema de Agentes IA",
    "Integração WhatsApp",
    "Vector Stores",
    "Síntese de Voz",
    "Follow-up Automático",
    "Analytics Avançado"
  ];

  // Verificação ultra-rápida do status da landing page e usuário
  useEffect(() => {
    const checkStatusAndUser = async () => {
      try {
        // Verificar status da landing page primeiro (com cache de 30s)
        const statusResponse = await fetch("/api/system/landing-page-status");
        const statusData = await statusResponse.json();
        
        const landingEnabled = statusData.success ? statusData.landingPageEnabled : false;
        setIsLandingPageEnabled(landingEnabled);

        // Verificar usuário
        const user = getCurrentUser();
        
        if (user) {
          // Usuário logado - redirecionar sempre
          if (user.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        } else {
          // Usuário não logado
          if (landingEnabled) {
            // Mostrar landing page
            setShowLandingPage(true);
          } else {
            // Redirecionar para login
            router.push("/auth/login");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
        // Em caso de erro, redirecionar para login por segurança
        router.push("/auth/login");
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatusAndUser();
  }, [router]);

  useEffect(() => {
    if (showLandingPage) {
      const interval = setInterval(() => {
        setActiveFeature((prev) => (prev + 1) % features.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [showLandingPage]);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleDemo = () => {
    router.push("/demo");
  };

  // Loading state enquanto verifica status
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-8"></div>
          <p className="text-white text-xl">
            Carregando {systemName || "sistema"}...
          </p>
        </div>
      </div>
    );
  }

  // Se landing page desabilitada ou usuário logado, não renderizar
  if (!showLandingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-pulse text-white text-xl">Redirecionando...</div>
        </div>
      </div>
    );
  }

  // Renderizar landing page completa
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
    </div>
  );
}
