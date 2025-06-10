"use client"

import { useEffect } from "react"
import { useTheme } from "@/components/theme-provider"

interface DynamicTitleProps {
  suffix?: string
}

function DynamicTitle({ suffix }: DynamicTitleProps) {
  const { theme, isLoading } = useTheme()

  useEffect(() => {
    // Só atualizar o título quando tiver tema do banco de dados
    if (!isLoading && theme && theme.systemName) {
      const baseTitle = theme.systemName
      const fullTitle = suffix ? `${baseTitle} - ${suffix}` : baseTitle
      document.title = fullTitle
    }
  }, [theme, isLoading, suffix])

  return null
}

export default DynamicTitle
export { DynamicTitle }
