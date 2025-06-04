import { Bot, Users } from "lucide-react"

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Bots Ativos Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Bot className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Bots Ativos</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">3</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Agentes Criados Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Users className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Agentes Criados</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">12</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
