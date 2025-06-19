import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("🔄 [API] Criando novo agente")
    console.log("📝 [API] Dados recebidos:", body)

    // Criar o agente no banco
    const { data: newAgent, error } = await supabase.from("ai_agents").insert(body).select().single()

    if (error) {
      console.error("❌ [API] Erro ao criar agente:", error)
      return NextResponse.json({ error: `Erro ao criar agente: ${error.message}` }, { status: 500 })
    }

    console.log("✅ [API] Agente criado com sucesso:", newAgent)

    return NextResponse.json(newAgent)
  } catch (error) {
    console.error("❌ [API] Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
