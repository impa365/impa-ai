import { useState, useEffect } from 'react'

export interface SystemConfig {
  systemName: string
  description: string
  logoIcon: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  textColor?: string
  backgroundColor?: string
  fontFamily?: string
  borderRadius?: string
  customCss?: string
  logoUrl?: string
  faviconUrl?: string
  allowPublicRegistration?: boolean
}

export interface UseSystemConfigReturn {
  config: SystemConfig | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSystemConfig(): UseSystemConfigReturn {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/config')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar configurações')
      }

      const data = await response.json()
      
      if (data.theme) {
        setConfig({
          systemName: data.theme.systemName,
          description: data.theme.description,
          logoIcon: data.theme.logoIcon,
          primaryColor: data.theme.primaryColor,
          secondaryColor: data.theme.secondaryColor,
          accentColor: data.theme.accentColor,
          textColor: data.theme.textColor,
          backgroundColor: data.theme.backgroundColor,
          fontFamily: data.theme.fontFamily,
          borderRadius: data.theme.borderRadius,
          customCss: data.theme.customCss,
          logoUrl: data.theme.logoUrl,
          faviconUrl: data.theme.faviconUrl,
          allowPublicRegistration: data.settings?.allowPublicRegistration || false,
        })
      } else {
        throw new Error('Dados de configuração inválidos')
      }
    } catch (err) {
      // Não logar no console para evitar logs desnecessários no client
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações')
      setConfig(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  return {
    config,
    isLoading,
    error,
    refetch: fetchConfig,
  }
}

// Hook otimizado para usar apenas o nome do sistema
export function useSystemName(): {
  systemName: string | null
  isLoading: boolean
  error: string | null
} {
  const [systemName, setSystemName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSystemName = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/config')
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao buscar nome do sistema')
        }

        const data = await response.json()
        
        if (data.theme?.systemName) {
          setSystemName(data.theme.systemName)
        } else {
          throw new Error('Nome do sistema não encontrado')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar nome do sistema')
        setSystemName(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSystemName()
  }, [])
  
  return {
    systemName,
    isLoading,
    error,
  }
} 