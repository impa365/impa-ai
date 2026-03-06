import { NextResponse } from "next/server"
import { queryOne, query } from "@/lib/db"

// Cache simples para versão
let versionCache: { version: string; timestamp: number } | null = null
const CACHE_TTL = 60 * 1000 // 1 minuto

export async function GET() {
  try {
    // Verificar cache primeiro
    const now = Date.now()
    if (versionCache && (now - versionCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ version: versionCache.version })
    }

    const row = await queryOne<{ setting_value: string }>(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      ['app_version']
    )

    const version = row?.setting_value || "1.0.0"

    // Atualizar cache
    versionCache = { version, timestamp: now }

    return NextResponse.json({ version })
  } catch (error: any) {
    return NextResponse.json({ version: "1.0.0" })
  }
}

export async function POST(request: Request) {
  try {
    const { version } = await request.json()

    if (!version) {
      return NextResponse.json({ error: "Versão é obrigatória" }, { status: 400 })
    }

    await query(
      'UPDATE system_settings SET setting_value = $1, updated_at = $2 WHERE setting_key = $3',
      [version, new Date().toISOString(), 'app_version']
    )

    // Invalidar cache
    versionCache = null

    console.log("✅ Versão atualizada:", version)
    return NextResponse.json({ success: true, version })
  } catch (error: any) {
    console.error("💥 Erro ao atualizar versão:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
