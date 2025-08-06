#!/usr/bin/env node

/**
 * Script de validação de variáveis de ambiente para Docker Swarm
 * Falha se variáveis obrigatórias não estiverem configuradas
 */

const requiredEnvVars = [
  'NEXTAUTH_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'NEXTAUTH_SECRET'
]

const optionalEnvVars = [
  'CUSTOM_KEY',
  'NODE_ENV'
]

console.log('🔍 Validando variáveis de ambiente...')

let hasErrors = false

// Validar variáveis obrigatórias
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ERRO: ${envVar} não está definida`)
    hasErrors = true
  } else {
    console.log(`✅ ${envVar}: ${process.env[envVar].substring(0, 20)}...`)
  }
}

// Verificar variáveis opcionais
for (const envVar of optionalEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: ${process.env[envVar].substring(0, 20)}...`)
  } else {
    console.log(`⚠️  ${envVar}: não definida (opcional)`)
  }
}

// Validar formato da URL
if (process.env.NEXTAUTH_URL) {
  try {
    const url = new URL(process.env.NEXTAUTH_URL)
    if (!url.protocol.startsWith('http')) {
      console.error('❌ ERRO: NEXTAUTH_URL deve usar protocolo HTTP/HTTPS')
      hasErrors = true
    }
    console.log(`✅ NEXTAUTH_URL formato válido: ${url.protocol}//${url.host}`)
  } catch (error) {
    console.error('❌ ERRO: NEXTAUTH_URL formato inválido')
    hasErrors = true
  }
}

// Validar formato do Supabase
if (process.env.SUPABASE_URL) {
  try {
    const url = new URL(process.env.SUPABASE_URL)
    if (!url.hostname.includes('supabase')) {
      console.warn('⚠️  AVISO: SUPABASE_URL não parece ser um domínio Supabase válido')
    }
    console.log(`✅ SUPABASE_URL formato válido: ${url.protocol}//${url.host}`)
  } catch (error) {
    console.error('❌ ERRO: SUPABASE_URL formato inválido')
    hasErrors = true
  }
}

if (hasErrors) {
  console.error('\n🚨 ERRO: Variáveis de ambiente obrigatórias não configuradas!')
  console.error('O sistema não pode iniciar sem essas configurações.')
  console.error('\nVerifique seu docker-compose.yml ou variáveis de ambiente.')
  process.exit(1)
} else {
  console.log('\n✅ Todas as variáveis de ambiente estão configuradas corretamente!')
  console.log('🚀 Sistema pronto para iniciar...')
} 