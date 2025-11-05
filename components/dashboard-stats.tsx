"use client"

import { useEffect, useState } from "react"
import { Bot, Smartphone } from "lucide-react"

interface DashboardStats {
  agentCount: number
  connectionCount: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    agentCount: 0,
    connectionCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/dashboard/stats", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro ao buscar estatísticas")
        }

        const data = await response.json()

        setStats({
          agentCount: data.stats.agentCount || 0,
          connectionCount: data.stats.connectionCount || 0,
        })

        console.log("✅ Estatísticas carregadas:", data.stats)
      } catch (error: any) {
        console.error("❌ Erro ao buscar estatísticas:", error.message)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">Erro ao carregar estatísticas: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-quest-id="dashboard-stats">
      {/* Conexões WhatsApp Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Smartphone className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Conexões WhatsApp</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {loading ? (
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                  ) : (
                    stats.connectionCount
                  )}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Agentes Criados Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Bot className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Agentes Criados</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {loading ? (
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                  ) : (
                    stats.agentCount
                  )}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
