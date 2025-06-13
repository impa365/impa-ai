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
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null, // Fallback inicial para valor de build
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null, // Fallback inicial
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
          // Tenta ler o corpo do erro se for JSON, caso contrário usa o statusText
          let errorBody = `Failed to fetch runtime config: ${response.status} ${response.statusText}`
          try {
            const errorData = await response.json()
            if (errorData && errorData.error) {
              errorBody = `Failed to fetch runtime config: ${errorData.error}`
            }
          } catch (jsonError) {
            // Ignora se o corpo do erro não for JSON
          }
          throw new Error(errorBody)
        }
        const data = await response.json()

        if (isMounted) {
          // console.log("RuntimeConfigProvider: Config fetched:", data)
          if (!data.supabaseUrl || !data.supabaseAnonKey) {
            // console.warn("RuntimeConfigProvider: /api/config retornou dados incompletos. Usando fallbacks se disponíveis.");
            setConfig((prevConfig) => ({
              ...prevConfig, // Mantém fallbacks de build se a API não retornar tudo
              supabaseUrl: data.supabaseUrl || prevConfig.supabaseUrl,
              supabaseAnonKey: data.supabaseAnonKey || prevConfig.supabaseAnonKey,
              loading: false,
              error:
                !data.supabaseUrl || !data.supabaseAnonKey
                  ? new Error("/api/config did not return complete Supabase credentials.")
                  : null,
            }))
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
          setConfig((prevConfig) => ({
            ...prevConfig,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }))
        }
      }
    }

    if (typeof window !== "undefined") {
      // Executa apenas no cliente
      fetchConfig()
    } else {
      // No SSR, os valores de process.env já foram usados no estado inicial.
      // Marcamos como não carregando.
      if (isMounted) {
        setConfig((prev) => ({ ...prev, loading: false }))
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
