"use client"

import OnboardingTutorial from "@/components/onboarding-tutorial"

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo ao painel principal da Impa AI</p>
      </div>

      {/* Tutorial de Onboarding */}
      <OnboardingTutorial />

      {/* Conteúdo adicional do dashboard pode ser adicionado aqui futuramente */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Espaço reservado para futuras funcionalidades */}
      </div>
    </div>
  )
}
