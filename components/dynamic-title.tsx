"use client"

import { useEffect } from "react"
import { useTheme } from "@/components/theme-provider"

interface DynamicTitleProps {
  suffix?: string
}

export function DynamicTitle({ suffix }: DynamicTitleProps) {
  const { theme } = useTheme()

  useEffect(() => {
    const baseTitle = theme.systemName || "Impa AI"
    const fullTitle = suffix ? `${baseTitle} - ${suffix}` : baseTitle
    document.title = fullTitle
  }, [theme.systemName, suffix])

  return null
}
