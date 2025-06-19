import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id
    const body = await request.json()

    console.log("🔄 [API] Atualizando agente:", agentId)
    console.log("📝 [API] Dados recebidos:", body)

    // Atualizar o agente no banco
    const { data: updatedAgent, error } = await supabase
      .from("ai_agents")
      .update(body)
      .eq("id", agentId)
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Erro ao atualizar agente:", error)
      return NextResponse.json({ error: `Erro ao atualizar agente: ${error.message}` }, { status: 500 })
    }

    console.log("✅ [API] Agente atualizado com sucesso:", updatedAgent)

    return NextResponse.json(updatedAgent)
  } catch (error) {
    console.error("❌ [API] Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id

    console.log("🔄 [API] Deletando agente:", agentId)

    // Deletar o agente do banco
    const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)

    if (error) {
      console.error("❌ [API] Erro ao deletar agente:", error)
      return NextResponse.json({ error: `Erro ao deletar agente: ${error.message}` }, { status: 500 })
    }

    console.log("✅ [API] Agente deletado com sucesso")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ [API] Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
