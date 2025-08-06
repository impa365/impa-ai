import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'impaai'
  }
})

export async function getSystemName(): Promise<string> {
  try {
    // Buscar tema ativo que contém o nome do sistema
    const { data: themes, error } = await supabase
      .from('system_themes')
      .select('display_name')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Erro ao buscar nome do sistema:', error)
      return 'Sistema de IA'
    }

    if (themes && themes.length > 0) {
      return themes[0].display_name || 'Sistema de IA'
    }

    // Fallback para configuração do sistema
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'app_name')
      .single()

    if (settingsError) {
      console.error('Erro ao buscar configuração do sistema:', settingsError)
      return 'Sistema de IA'
    }

    return settings?.setting_value || 'Sistema de IA'
  } catch (error) {
    console.error('Erro ao buscar nome do sistema:', error)
    return 'Sistema de IA'
  }
}

export async function getSystemSettings() {
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')

    if (error) {
      console.error('Erro ao buscar configurações:', error)
      return {}
    }

    // Converter array para objeto
    const settingsObj: Record<string, any> = {}
    settings?.forEach((setting: any) => {
      settingsObj[setting.setting_key] = setting.setting_value
    })

    return settingsObj
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return {}
  }
} 