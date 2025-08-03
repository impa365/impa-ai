"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MessageSquare, Settings, Users, Building2 } from "lucide-react"

export default function FollowupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Leads",
      href: "/admin/followup",
      icon: Users,
      description: "Visualizar e gerenciar leads no follow-up",
      current: pathname === "/admin/followup",
    },
    {
      name: "Mensagens",
      href: "/admin/followup/mensagens",
      icon: MessageSquare,
      description: "Configurar mensagens por dia de follow-up",
      current: pathname === "/admin/followup/mensagens",
    },
    {
      name: "Configuração",
      href: "/admin/followup/config",
      icon: Settings,
      description: "Mensagens de entrada e saída do follow-up",
      current: pathname === "/admin/followup/config",
    },
  ]

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            Follow Diário
          </h1>
          <p className="text-sm lg:text-base text-gray-600">
            Gerencie leads, mensagens e configurações do follow-up de 24 horas
          </p>
        </div>
        <Badge variant="secondary" className="hidden sm:flex">
          Sistema de Follow-up
        </Badge>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <nav className="flex flex-col sm:flex-row gap-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    item.current
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-75 hidden lg:block">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Content */}
      {children}
    </div>
  )
} 