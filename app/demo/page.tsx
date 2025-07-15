"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSystemName } from "@/hooks/use-system-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Smartphone,
  MessageSquare,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Zap,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  BarChart3
} from "lucide-react";

export default function DemoPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { systemName, isLoading: isLoadingSystemName } = useSystemName();

  const demoSteps = [
    {
      title: "1. Conectar WhatsApp",
      description: "Escaneie o QR Code e conecte sua instância WhatsApp em segundos",
      icon: <Smartphone className="w-8 h-8" />,
      image: "/demo-qr.png",
      details: "Processo completamente automatizado com validação em tempo real"
    },
    {
      title: "2. Criar Agente IA",
      description: "Configure sua IA com personalidade única e funções específicas",
      icon: <Bot className="w-8 h-8" />,
      image: "/demo-agent.png",
      details: "Mais de 50 personalidades pré-configuradas disponíveis"
    },
    {
      title: "3. Treinar Conhecimento",
      description: "Carregue documentos, links e informações para sua IA",
      icon: <CheckCircle className="w-8 h-8" />,
      image: "/demo-training.png",
      details: "Suporte a PDFs, websites, textos e integrações avançadas"
    },
    {
      title: "4. Atendimento Ativo",
      description: "Sua IA já está respondendo clientes 24/7 automaticamente",
      icon: <MessageSquare className="w-8 h-8" />,
      image: "/demo-chat.png",
      details: "Respostas inteligentes com contexto completo"
    },
  ];

  const features = [
    { name: "Setup Rápido", time: "5 minutos", icon: <Clock className="w-5 h-5" /> },
    { name: "Múltiplos Agentes", count: "Ilimitados", icon: <Bot className="w-5 h-5" /> },
    { name: "Usuários Simultâneos", count: "1000+", icon: <Users className="w-5 h-5" /> },
    { name: "Agendamentos", feature: "Automático", icon: <Calendar className="w-5 h-5" /> },
    { name: "Analytics", feature: "Tempo Real", icon: <BarChart3 className="w-5 h-5" /> },
    { name: "Integrações", count: "20+", icon: <Zap className="w-5 h-5" /> },
  ];

  const handlePlayDemo = () => {
    setIsPlaying(true);
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= demoSteps.length - 1) {
          setIsPlaying(false);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);
  };

  const handlePauseDemo = () => {
    setIsPlaying(false);
  };

  const handleResetDemo = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleBackToLanding = () => {
    router.push("/landing");
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-white/20">
        <Button
          variant="ghost"
          onClick={handleBackToLanding}
          className="text-white hover:bg-white/10 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
                      <span className="text-xl font-bold text-white">
                              {systemName || "Sistema de IA"} - Demonstração
            </span>
        </div>

        <Button 
          onClick={handleLogin}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-full"
        >
          Começar Agora
        </Button>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-6">
                            Veja o {systemName || "Sistema de IA"} em <span className="text-blue-400">Ação</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Uma demonstração interativa de como criar e configurar seu primeiro agente de IA em minutos
          </p>
        </div>

        {/* Demo Controls */}
        <div className="flex justify-center gap-4 mb-12">
          <Button
            onClick={isPlaying ? handlePauseDemo : handlePlayDemo}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-full flex items-center gap-2"
            disabled={currentStep >= demoSteps.length - 1 && !isPlaying}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isPlaying ? "Pausar Demo" : "Iniciar Demo"}
          </Button>
          <Button
            onClick={handleResetDemo}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-full flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reiniciar
          </Button>
        </div>

        {/* Demo Steps */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Steps Navigation */}
          <div className="space-y-4">
            {demoSteps.map((step, index) => (
              <Card 
                key={index}
                className={`cursor-pointer transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-white/20 border-blue-400 scale-105' 
                    : index < currentStep 
                      ? 'bg-white/10 border-green-400' 
                      : 'bg-white/5 border-white/20'
                } backdrop-blur-md`}
                onClick={() => setCurrentStep(index)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      index === currentStep 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                        : index < currentStep 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : 'bg-gray-600'
                    } text-white`}>
                      {index < currentStep ? <CheckCircle className="w-6 h-6" /> : step.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-gray-300 text-sm">{step.description}</p>
                      <p className="text-blue-300 text-xs mt-1">{step.details}</p>
                    </div>
                    {index === currentStep && (
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Demo Visualization */}
          <div className="relative">
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 p-8 h-96">
              <CardContent className="p-0 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 mx-auto">
                    {demoSteps[currentStep].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {demoSteps[currentStep].title}
                  </h3>
                  <p className="text-gray-300 text-lg">
                    {demoSteps[currentStep].description}
                  </p>
                  <div className="mt-6">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {demoSteps[currentStep].details}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress indicator */}
            <div className="absolute -bottom-4 left-0 right-0">
              <div className="flex justify-center space-x-2">
                {demoSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index <= currentStep ? 'bg-blue-400 w-8' : 'bg-white/30 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Recursos Inclusos na Demonstração
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.name}</h3>
                  <div className="text-2xl font-bold text-blue-400">
                    {feature.time || feature.count || feature.feature}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-white/20 p-12 text-center">
          <CardContent className="p-0">
            <h2 className="text-4xl font-bold text-white mb-6">
              Impressionado? Comece Agora!
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Crie sua conta gratuita e tenha seu primeiro agente funcionando em menos de 5 minutos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 rounded-full text-lg font-semibold"
              >
                <Zap className="w-5 h-5 mr-2" />
                Criar Conta Grátis
              </Button>
              <Button 
                onClick={handleBackToLanding}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-12 py-4 rounded-full text-lg"
              >
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 