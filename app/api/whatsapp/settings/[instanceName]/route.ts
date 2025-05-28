import { type NextRequest, NextResponse } from "next/server"
import { applyWhatsAppSettings } from "@/lib/whatsapp-settings-api"

export async function POST(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params
    const settings = await request.json()

    const result = await applyWhatsAppSettings(instanceName, settings)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro na API de configurações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
