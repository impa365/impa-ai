"use client"

import OnboardingTutorial from "@/components/onboarding-tutorial"
import DashboardStats from "@/components/dashboard-stats"

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo ao painel principal da Impa AI</p>
      </div>

      {/* Estatísticas do Dashboard - AGORA ACIMA do tutorial */}
      <DashboardStats />

      {/* Tutorial de Onboarding - AGORA ABAIXO das estatísticas */}
      <OnboardingTutorial />
    </div>
  )
}
