"use client"

import { useEffect } from "react"
import { useTheme } from "@/components/theme-provider"

interface DynamicTitleProps {
  suffix?: string
}

function DynamicTitle({ suffix }: DynamicTitleProps) {
  const { theme, isLoading } = useTheme()

  useEffect(() => {
    // Só atualizar o título quando o tema estiver carregado
    if (!isLoading && theme) {
      const baseTitle = theme.systemName || "Sistema"
      const fullTitle = suffix ? `${baseTitle} - ${suffix}` : baseTitle
      document.title = fullTitle
    }
  }, [theme, isLoading, suffix])

  return null
}

export default DynamicTitle
export { DynamicTitle }
