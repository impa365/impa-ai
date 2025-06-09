import { type NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name } = body

    // As validações mais detalhadas agora estão dentro de registerUser em lib/auth.ts
    // Mas podemos manter uma validação básica aqui para campos obrigatórios antes de chamar a função
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Chamar a função de registro manual
    const result = await registerUser({ email, password, full_name })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    console.error("Erro na API de registro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
