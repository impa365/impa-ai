"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface RuntimeConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  nextAuthUrl?: string
  nodeEnv?: string
}

interface RuntimeConfigContextType {
  config: RuntimeConfig | null
  loading: boolean
  error: string | null
}

const RuntimeConfigContext = createContext<RuntimeConfigContextType>({
  config: null,
  loading: true,
  error: null,
})

export function RuntimeConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RuntimeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        console.log("[RuntimeConfigProvider] Fetching runtime config...")
        const response = await fetch("/api/config")

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const configData = await response.json()

        // Validar se não são placeholders
        if (configData.supabaseUrl?.includes("placeholder-build")) {
          throw new Error("Config contains placeholder URL")
        }
        if (configData.supabaseAnonKey?.includes("placeholder-build")) {
          throw new Error("Config contains placeholder key")
        }

        console.log("[RuntimeConfigProvider] ✅ Valid config loaded")
        setConfig(configData)
        setError(null)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        console.error("[RuntimeConfigProvider] ❌ Failed to load config:", errorMsg)
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return <RuntimeConfigContext.Provider value={{ config, loading, error }}>{children}</RuntimeConfigContext.Provider>
}

export function useRuntimeConfig() {
  const context = useContext(RuntimeConfigContext)
  if (!context) {
    throw new Error("useRuntimeConfig must be used within RuntimeConfigProvider")
  }
  return context
}
