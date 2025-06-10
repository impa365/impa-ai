"use client"

import { useEffect } from "react"
import { useTheme } from "@/components/theme-provider"

interface DynamicTitleProps {
  suffix?: string
}

function DynamicTitle({ suffix }: DynamicTitleProps) {
  const { theme } = useTheme()

  useEffect(() => {
    const baseTitle = theme.systemName || "Carregando..."
    const fullTitle = suffix ? `${baseTitle} - ${suffix}` : baseTitle
    document.title = fullTitle
  }, [theme.systemName, suffix])

  return null
}

export default DynamicTitle
export { DynamicTitle }
