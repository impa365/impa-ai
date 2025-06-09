import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    // Apenas para depuração - NÃO USAR EM PRODUÇÃO
    // Esta rota é apenas para diagnóstico temporário
    const { data, error } = await supabase.from("user_profiles").select("email, password").eq("email", email).single()

    if (error) {
      return NextResponse.json(
        {
          message: "Erro ao buscar usuário",
          error: error.message,
        },
        { status: 404 },
      )
    }

    // Retorna informações sanitizadas para diagnóstico
    return NextResponse.json({
      found: true,
      passwordLength: data.password ? data.password.length : 0,
      hasSpaces: data.password ? data.password.includes(" ") : false,
      firstChar: data.password ? data.password.charAt(0) : "",
      lastChar: data.password ? data.password.charAt(data.password.length - 1) : "",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Erro interno",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
