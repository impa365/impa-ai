"use client"

import { useEffect, useState } from "react"
import { Bot, Smartphone } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

export default function DashboardStats() {
  const [stats, setStats] = useState({
    agentCount: 0,
    connectionCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const user = getCurrentUser()
        if (!user) return

        // Buscar quantidade real de agentes
        const { data: agents, error: agentsError } = await supabase
          .from("ai_agents")
          .select("id")
          .eq("user_id", user.id)

        if (agentsError) throw agentsError

        // Buscar quantidade real de conexões WhatsApp
        const { data: connections, error: connectionsError } = await supabase
          .from("whatsapp_connections")
          .select("id")
          .eq("user_id", user.id)

        if (connectionsError) throw connectionsError

        setStats({
          agentCount: agents?.length || 0,
          connectionCount: connections?.length || 0,
        })
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Conexões WhatsApp Card (substituindo Bots) */}
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
                  {loading ? <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div> : stats.connectionCount}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Agentes Criados Card - agora com dados reais */}
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
                  {loading ? <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div> : stats.agentCount}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
