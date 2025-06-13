"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo } from "react"

interface RuntimeConfig {
  supabaseUrl: string | null
  supabaseAnonKey: string | null
  loading: boolean
  error: Error | null
}

const RuntimeConfigContext = createContext<RuntimeConfig | undefined>(undefined)

export function RuntimeConfigProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [config, setConfig] = useState<RuntimeConfig>({
    supabaseUrl: null, // Inicializa como nulo, será preenchido pela API
    supabaseAnonKey: null, // Inicializa como nulo
    loading: true,
    error: null,
  })

  useEffect(() => {
    let isMounted = true
    async function fetchConfig() {
      // console.log("RuntimeConfigProvider: Fetching /api/config...")
      try {
        const response = await fetch("/api/config")
        if (!response.ok) {
          let errorBody = `Failed to fetch runtime config: ${response.status} ${response.statusText}`
          try {
            const errorData = await response.json()
            if (errorData && errorData.error) {
              errorBody = `Failed to fetch runtime config: ${errorData.error}`
            }
          } catch (jsonError) {
            /* Ignora */
          }
          throw new Error(errorBody)
        }
        const data = await response.json()

        if (isMounted) {
          // console.log("RuntimeConfigProvider: Config fetched:", data)
          if (!data.supabaseUrl || !data.supabaseAnonKey) {
            // console.warn("RuntimeConfigProvider: /api/config retornou dados incompletos.");
            setConfig({
              supabaseUrl: data.supabaseUrl || null,
              supabaseAnonKey: data.supabaseAnonKey || null,
              loading: false,
              error: new Error("/api/config did not return complete Supabase credentials."),
            })
          } else {
            setConfig({
              supabaseUrl: data.supabaseUrl,
              supabaseAnonKey: data.supabaseAnonKey,
              loading: false,
              error: null,
            })
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("RuntimeConfigProvider: Error fetching config:", error)
          setConfig({
            supabaseUrl: null,
            supabaseAnonKey: null,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          })
        }
      }
    }

    // Executa apenas no cliente
    if (typeof window !== "undefined") {
      fetchConfig()
    } else {
      // No SSR, não temos como buscar a config do cliente ainda.
      // O estado inicial será loading: true.
      // Se você precisar de SSR com config, a estratégia precisaria ser diferente (ex: passar via pageProps).
      if (isMounted) {
        setConfig((prev) => ({
          ...prev,
          loading: true,
          error: new Error("Config not available on server for client provider."),
        }))
      }
    }

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(() => config, [config])

  return <RuntimeConfigContext.Provider value={value}>{children}</RuntimeConfigContext.Provider>
}

export function useRuntimeConfig(): RuntimeConfig {
  const context = useContext(RuntimeConfigContext)
  if (context === undefined) {
    throw new Error("useRuntimeConfig must be used within a RuntimeConfigProvider")
  }
  return context
}
