import { NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/admin/agents/[id]/availability
 * Retorna os horários de disponibilidade de um agente (admin)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentServerUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se é admin
    if (currentUser.role !== "admin" && currentUser.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 })
    }

    const agentId = params.id

    // Verificar se o agente existe
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, user_id")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ success: false, error: "Agente não encontrado" }, { status: 404 })
    }

    // Buscar schedules do agente
    const { data: schedules, error: schedulesError } = await supabase
      .from("agent_availability_schedules")
      .select("*")
      .eq("agent_id", agentId)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true })

    if (schedulesError) {
      console.error("Erro ao buscar schedules:", schedulesError)
      return NextResponse.json({ success: false, error: "Erro ao buscar horários" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      schedules: schedules || [],
    })
  } catch (error) {
    console.error("Erro ao buscar horários:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

/**
 * POST /api/admin/agents/[id]/availability
 * Cria/atualiza horários de disponibilidade de um agente (admin)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentServerUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se é admin
    if (currentUser.role !== "admin" && currentUser.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 })
    }

    const agentId = params.id
    const body = await request.json()
    const { schedules } = body

    if (!Array.isArray(schedules)) {
      return NextResponse.json({ success: false, error: "Schedules deve ser um array" }, { status: 400 })
    }

    // Verificar se o agente existe
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, user_id")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ success: false, error: "Agente não encontrado" }, { status: 404 })
    }

    // Deletar schedules antigos
    await supabase.from("agent_availability_schedules").delete().eq("agent_id", agentId)

    // Inserir novos schedules
    if (schedules.length > 0) {
      const schedulesToInsert = schedules.map((schedule) => ({
        agent_id: agentId,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        timezone: schedule.timezone || "America/Sao_Paulo",
        is_active: schedule.is_active !== false,
      }))

      const { error: insertError } = await supabase
        .from("agent_availability_schedules")
        .insert(schedulesToInsert)

      if (insertError) {
        console.error("Erro ao inserir schedules:", insertError)
        return NextResponse.json({ success: false, error: "Erro ao salvar horários" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Horários salvos com sucesso",
    })
  } catch (error) {
    console.error("Erro ao salvar horários:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/agents/[id]/availability
 * Remove todos os horários de disponibilidade de um agente (admin)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentServerUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se é admin
    if (currentUser.role !== "admin" && currentUser.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 })
    }

    const agentId = params.id

    // Verificar se o agente existe
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, user_id")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ success: false, error: "Agente não encontrado" }, { status: 404 })
    }

    // Deletar schedules
    const { error: deleteError } = await supabase
      .from("agent_availability_schedules")
      .delete()
      .eq("agent_id", agentId)

    if (deleteError) {
      console.error("Erro ao deletar schedules:", deleteError)
      return NextResponse.json({ success: false, error: "Erro ao deletar horários" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Horários removidos com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar horários:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
