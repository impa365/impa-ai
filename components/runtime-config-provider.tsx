"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Define the context type
interface RuntimeConfigContextType {
  supabase: SupabaseClient | null
  isLoading: boolean
  error: string | null
  isDevEnvironment: boolean
}

// Create the context with default values
const RuntimeConfigContext = createContext<RuntimeConfigContextType>({
  supabase: null,
  isLoading: true,
  error: null,
  isDevEnvironment: false,
})

// Hook to use the context
export const useRuntimeConfig = () => useContext(RuntimeConfigContext)

// Provider component
export function RuntimeConfigProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDevEnvironment, setIsDevEnvironment] = useState(false)

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        // Verificar se estamos em ambiente de desenvolvimento
        const isDev = process.env.NODE_ENV !== "production"
        setIsDevEnvironment(isDev)

        // Valores padrão para desenvolvimento
        let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co"
        let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

        // Em produção, buscar configuração da API
        if (!isDev) {
          try {
            const response = await fetch("/api/config")
            if (!response.ok) {
              throw new Error(`API de configuração retornou ${response.status}: ${response.statusText}`)
            }
            const config = await response.json()

            if (config.NEXT_PUBLIC_SUPABASE_URL) {
              supabaseUrl = config.NEXT_PUBLIC_SUPABASE_URL
            }

            if (config.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
              supabaseAnonKey = config.NEXT_PUBLIC_SUPABASE_ANON_KEY
            }
          } catch (apiError: any) {
            console.error("❌ Falha ao buscar configuração da API:", apiError)
            setError(`Falha ao carregar configuração: ${apiError.message}`)
            setIsLoading(false)
            return
          }
        }

        // Criar cliente Supabase
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          db: { schema: "impaai" },
          global: { headers: { "Accept-Profile": "impaai", "Content-Profile": "impaai" } },
        })

        console.log(`✅ Cliente Supabase inicializado para URL: ${new URL(supabaseUrl).hostname}`)

        // Em desenvolvimento, mostrar aviso
        if (isDev) {
          console.warn("⚠️ Ambiente de desenvolvimento detectado. Usando cliente Supabase com valores padrão.")
        }

        setSupabase(client)
        setIsLoading(false)
      } catch (error: any) {
        console.error("❌ Falha ao inicializar cliente Supabase:", error)
        setError(`Falha ao inicializar cliente Supabase: ${error.message}`)
        setIsLoading(false)
      }
    }

    initializeSupabase()
  }, [])

  // Em ambiente de desenvolvimento, mostrar uma interface simplificada
  if (isDevEnvironment && isLoading) {
    return (
      <RuntimeConfigContext.Provider
        value={{
          supabase,
          isLoading,
          error,
          isDevEnvironment,
        }}
      >
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-2 text-center text-sm z-50">
          ⚠️ Ambiente de desenvolvimento - Supabase usando valores padrão
        </div>
        {children}
      </RuntimeConfigContext.Provider>
    )
  }

  return (
    <RuntimeConfigContext.Provider
      value={{
        supabase,
        isLoading,
        error,
        isDevEnvironment,
      }}
    >
      {children}
    </RuntimeConfigContext.Provider>
  )
}
