"use client"

import { LayoutDashboard, Webhook, Zap, FileText, Plug, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "integration", label: "Integração Cal.com", icon: Plug },
    { id: "triggers", label: "Gatilhos", icon: Zap },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "logs", label: "Execuções", icon: FileText },
    { id: "settings", label: "Configurações", icon: Settings },
  ]

  return (
    <aside className="w-64 border-r border-border bg-sidebar p-6 flex flex-col">
      <div className="mb-12">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary"></div>
          RemindHub
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Lembretes Inteligentes</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-sm text-sidebar-foreground",
                activeTab === item.id && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      <div className="pt-6 border-t border-sidebar-border">
        <div className="p-4 rounded-lg bg-sidebar-primary/10 border border-sidebar-primary/20">
          <p className="text-xs font-semibold text-sidebar-primary mb-2">Status</p>
          <p className="text-xs text-sidebar-foreground">
            ✓ Cal.com Conectado
            <br />✓ 12 Gatilhos Ativos
            <br />✓ 0 Erros Hoje
          </p>
        </div>
      </div>
    </aside>
  )
}
