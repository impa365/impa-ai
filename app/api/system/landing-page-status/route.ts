import { NextResponse } from "next/server"
import { queryOne, query } from '@/lib/db'

// Cache simples em memória para otimização
let cachedStatus: { enabled: boolean; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 segundos

export async function GET() {
  try {
    // Verificar se a landing page foi desabilitada completamente via variável de ambiente
    if (process.env.DISABLE_LANDING_PAGE === 'true') {
      return NextResponse.json({
        success: true,
        landingPageEnabled: false,
        disabled: true,
        message: "Landing page desabilitada via configuração do sistema"
      })
    }

    // Verificar cache primeiro para performance máxima
    if (cachedStatus && Date.now() - cachedStatus.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        landingPageEnabled: cachedStatus.enabled
      })
    }

    // Buscar configuração específica da landing page
    const setting = await queryOne<any>(
      "SELECT setting_value FROM system_settings WHERE setting_key = $1 LIMIT 1",
      ['landing_page_enabled']
    )

    let isEnabled = false

    if (setting) {
      const settingValue = setting.setting_value
      // Suporte a diferentes formatos de valor
      if (typeof settingValue === 'boolean') {
        isEnabled = settingValue
      } else if (typeof settingValue === 'string') {
        isEnabled = settingValue.toLowerCase() === 'true'
      }
    } else {
      // Se não existe a configuração, criar com valor padrão (habilitado)
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description, is_public, requires_restart)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'landing_page_enabled',
          'true',
          'interface',
          'Controla se a landing page está ativa ou se deve mostrar login direto',
          false,
          false
        ]
      )
      isEnabled = true
    }

    // Atualizar cache
    cachedStatus = {
      enabled: isEnabled,
      timestamp: Date.now()
    }

    return NextResponse.json({
      success: true,
      landingPageEnabled: isEnabled
    })

  } catch (error: any) {
    console.error("Erro ao verificar status da landing page:", error.message)
    
    // Em caso de erro, retorna desabilitado por segurança
    return NextResponse.json({
      success: true,
      landingPageEnabled: false
    })
  }
}

export async function POST(request: Request) {
  try {
    // Verificar se a landing page foi desabilitada completamente via variável de ambiente
    if (process.env.DISABLE_LANDING_PAGE === 'true') {
      return NextResponse.json({
        success: false,
        error: "Landing page está desabilitada via configuração do sistema e não pode ser alterada",
        disabled: true
      }, { status: 403 })
    }

    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: "Parâmetro 'enabled' deve ser boolean"
      }, { status: 400 })
    }

    // Verificar se a configuração já existe
    const existing = await queryOne<any>(
      "SELECT id FROM system_settings WHERE setting_key = $1",
      ['landing_page_enabled']
    )

    if (existing) {
      // Atualizar configuração existente
      await query(
        "UPDATE system_settings SET setting_value = $1, updated_at = $2 WHERE setting_key = $3",
        [enabled.toString(), new Date().toISOString(), 'landing_page_enabled']
      )
    } else {
      // Criar nova configuração
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, category, description, is_public, requires_restart, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          'landing_page_enabled',
          enabled.toString(),
          'interface',
          'Controla se a landing page está ativa ou se deve mostrar login direto',
          false,
          false,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      )
    }

    // Limpar cache para forçar atualização na próxima consulta
    cachedStatus = null

    return NextResponse.json({
      success: true,
      message: `Landing page ${enabled ? 'ativada' : 'desativada'} com sucesso!`,
      landingPageEnabled: enabled
    })

  } catch (error: any) {
    console.error("Erro ao atualizar status da landing page:", error.message)
    return NextResponse.json({
      success: false,
      error: `Erro ao atualizar configuração: ${error.message}`
    }, { status: 500 })
  }
} 