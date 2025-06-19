import { NextResponse } from "next/server"
import { getPublicSettings } from "@/services/settingsService"
import { convertKeysToCamelCase } from "@/utils/formatters"

export async function GET() {
  try {
    const settingsData = await getPublicSettings()

    if (!settingsData) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 })
    }

    const processedSettings = settingsData

    const finalResponseSettings = convertKeysToCamelCase(processedSettings)

    const apiResponse = {
      data: finalResponseSettings,
      success: true,
      error: null,
    }

    return NextResponse.json(apiResponse)
  } catch (error: any) {
    console.error("🔥 [API /api/config] Erro ao buscar configurações:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
