import type React from "react"
import { HomeIcon, UsersIcon, ShoppingBagIcon, BarChartIcon, CogIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: HomeIcon },
  { name: "Usuários", href: "/admin/users", icon: UsersIcon },
  { name: "Produtos", href: "/admin/products", icon: ShoppingBagIcon },
  { name: "Relatórios", href: "/admin/reports", icon: BarChartIcon },
  { name: "Configurações", href: "/admin/settings", icon: CogIcon },
]

interface Props {
  children: React.ReactNode
}

export default function AdminLayout({ children }: Props) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="h-16 flex items-center justify-center">
          <span className="text-lg font-semibold">Admin Panel</span>
        </div>
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover-interactive menu-item transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">{children}</div>
    </div>
  )
}
