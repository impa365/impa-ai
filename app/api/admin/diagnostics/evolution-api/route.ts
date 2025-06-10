import { NextResponse } from "next/server"
import { diagnoseEvolutionApiConfig } from "@/lib/evolution-api-diagnostics"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    // Verificar se o usuário é admin
    const currentUser = getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Não autorizado. Apenas administradores podem acessar esta rota." },
        { status: 403 },
      )
    }

    // Executar diagnóstico
    const diagnosticResult = await diagnoseEvolutionApiConfig()

    return NextResponse.json(diagnosticResult)
  } catch (error: any) {
    console.error("Erro ao executar diagnóstico:", error)
    return NextResponse.json({ error: `Erro ao executar diagnóstico: ${error.message}` }, { status: 500 })
  }
}
