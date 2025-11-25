import { NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { getSupabaseServer } from "@/lib/supabase-config"

/**
 * Converte horário no formato HH:MM para minutos desde meia-noite
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Verifica se dois intervalos de tempo se sobrepõem
 * Usa o algoritmo: (StartA < EndB) AND (EndA > StartB)
 */
function checkTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const start1Minutes = timeToMinutes(start1)
  const end1Minutes = timeToMinutes(end1)
  const start2Minutes = timeToMinutes(start2)
  const end2Minutes = timeToMinutes(end2)

  return start1Minutes < end2Minutes && end1Minutes > start2Minutes
}

/**
 * Valida se há sobreposição de horários na lista de schedules
 */
function validateSchedulesForOverlap(schedules: any[]): { isValid: boolean; message?: string } {
  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  
  // Agrupar por dia da semana
  for (let day = 0; day <= 6; day++) {
    const daySchedules = schedules.filter(s => s.day_of_week === day && s.is_active !== false)
    
    // Verificar sobreposição dentro do mesmo dia
    for (let i = 0; i < daySchedules.length; i++) {
      for (let j = i + 1; j < daySchedules.length; j++) {
        const schedule1 = daySchedules[i]
        const schedule2 = daySchedules[j]
        
        if (checkTimeOverlap(schedule1.start_time, schedule1.end_time, schedule2.start_time, schedule2.end_time)) {
          return {
            isValid: false,
            message: `Sobreposição detectada em ${dayNames[day]}: ` +
                     `Horário 1 (${schedule1.start_time}-${schedule1.end_time}) sobrepõe ` +
                     `Horário 2 (${schedule2.start_time}-${schedule2.end_time})`
          }
        }
      }
    }
  }
  
  return { isValid: true }
}

/**
 * GET /api/user/agents/[id]/availability
 * Retorna os horários de disponibilidade de um agente
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentServerUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 })
    }

    const { id: agentId } = await params
    const supabase = getSupabaseServer()

    // Verificar se o agente pertence ao usuário
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, user_id")
      .eq("id", agentId)
      .eq("user_id", currentUser.id)
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
 * POST /api/user/agents/[id]/availability
 * Cria/atualiza horários de disponibilidade de um agente
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentServerUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 })
    }

    const { id: agentId } = await params
    const body = await request.json()
    const { schedules } = body

    if (!Array.isArray(schedules)) {
      return NextResponse.json({ success: false, error: "Schedules deve ser um array" }, { status: 400 })
    }

    // Validar sobreposição de horários
    const validation = validateSchedulesForOverlap(schedules)
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Horários com sobreposição detectados", 
        details: validation.message 
      }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    // Verificar se o agente pertence ao usuário
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, user_id")
      .eq("id", agentId)
      .eq("user_id", currentUser.id)
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
 * DELETE /api/user/agents/[id]/availability
 * Remove todos os horários de disponibilidade de um agente
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentServerUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 })
    }

    const { id: agentId } = await params
    const supabase = getSupabaseServer()

    // Verificar se o agente pertence ao usuário
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, user_id")
      .eq("id", agentId)
      .eq("user_id", currentUser.id)
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
