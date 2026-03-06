import { type NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const data = await queryOne<any>(
      `SELECT * FROM integrations WHERE type = $1 AND is_active = $2 LIMIT 1`,
      ["evolution_api", true]
    )

    return NextResponse.json({
      success: true,
      data: data || null,
    })
  } catch (error) {
    console.error("Erro ao buscar integração Evolution API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar configurações",
      },
      { status: 500 },
    )
  }
}
