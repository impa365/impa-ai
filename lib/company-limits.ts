// Middleware para validar limites de empresa
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface CompanyLimits {
  max_users: number
  max_instances: number
  max_connections: number
  max_agents: number
  current_users: number
  current_instances: number
  current_connections: number
  current_agents: number
}

/**
 * Verifica se a empresa atingiu o limite para um determinado recurso
 */
export async function checkCompanyLimit(
  companyId: string,
  resourceType: "users" | "instances" | "connections" | "agents"
): Promise<{ allowed: boolean; message?: string; limits?: CompanyLimits }> {
  try {
    const supabase = await createClient()

    // Buscar empresa e limites
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single()

    if (companyError || !company) {
      return {
        allowed: false,
        message: "Empresa não encontrada",
      }
    }

    // Verificar se empresa está ativa
    if (company.status !== "active") {
      return {
        allowed: false,
        message: "Empresa está inativa ou suspensa",
      }
    }

    // Buscar estatísticas atuais
    const { data: stats, error: statsError } = await supabase.rpc(
      "get_company_stats",
      { p_company_id: companyId }
    )

    if (statsError) {
      console.error("Erro ao buscar estatísticas:", statsError)
      // Em caso de erro, permitir mas registrar
      return { allowed: true }
    }

    const currentStats = stats?.[0] || {
      total_users: 0,
      total_connections: 0,
      total_instances: 0,
      total_agents: 0,
    }

    const limits: CompanyLimits = {
      max_users: company.max_users,
      max_instances: company.max_instances,
      max_connections: company.max_connections,
      max_agents: company.max_agents,
      current_users: parseInt(currentStats.total_users) || 0,
      current_instances: parseInt(currentStats.total_instances) || 0,
      current_connections: parseInt(currentStats.total_connections) || 0,
      current_agents: parseInt(currentStats.total_agents) || 0,
    }

    // Verificar limite específico
    let exceeded = false
    let message = ""

    switch (resourceType) {
      case "users":
        exceeded = limits.current_users >= limits.max_users
        message = `Limite de usuários atingido (${limits.current_users}/${limits.max_users})`
        break
      case "instances":
        exceeded = limits.current_instances >= limits.max_instances
        message = `Limite de instâncias atingido (${limits.current_instances}/${limits.max_instances})`
        break
      case "connections":
        exceeded = limits.current_connections >= limits.max_connections
        message = `Limite de conexões atingido (${limits.current_connections}/${limits.max_connections})`
        break
      case "agents":
        exceeded = limits.current_agents >= limits.max_agents
        message = `Limite de agentes atingido (${limits.current_agents}/${limits.max_agents})`
        break
    }

    return {
      allowed: !exceeded,
      message: exceeded ? message : undefined,
      limits,
    }
  } catch (error) {
    console.error("Erro ao verificar limites:", error)
    // Em caso de erro, permitir mas registrar
    return { allowed: true }
  }
}

/**
 * Middleware de validação de limites para rotas de API
 */
export async function validateCompanyLimitMiddleware(
  request: NextRequest,
  resourceType: "users" | "instances" | "connections" | "agents",
  companyId?: string
): Promise<NextResponse | null> {
  try {
    // Se não tiver companyId, tentar extrair do usuário
    if (!companyId) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
      }

      // Buscar company_id do usuário
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("company_id, role")
        .eq("id", user.id)
        .single()

      if (!profile?.company_id) {
        // Super admin não tem company_id, pode criar recursos
        if (profile?.role === "super_admin") {
          return null
        }
        return NextResponse.json(
          { error: "Usuário sem empresa associada" },
          { status: 403 }
        )
      }

      companyId = profile.company_id
    }

    // Verificar limite
    const check = await checkCompanyLimit(companyId, resourceType)

    if (!check.allowed) {
      return NextResponse.json(
        {
          error: check.message || "Limite de recursos atingido",
          limits: check.limits,
        },
        { status: 403 }
      )
    }

    return null // Permitir continuar
  } catch (error) {
    console.error("Erro no middleware de limites:", error)
    return null // Em caso de erro, permitir continuar
  }
}

/**
 * Hook para usar em componentes cliente
 */
export async function getCompanyLimits(
  companyId: string
): Promise<CompanyLimits | null> {
  try {
    const supabase = await createClient()

    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single()

    if (!company) return null

    const { data: stats } = await supabase.rpc("get_company_stats", {
      p_company_id: companyId,
    })

    const currentStats = stats?.[0] || {
      total_users: 0,
      total_connections: 0,
      total_instances: 0,
      total_agents: 0,
    }

    return {
      max_users: company.max_users,
      max_instances: company.max_instances,
      max_connections: company.max_connections,
      max_agents: company.max_agents,
      current_users: parseInt(currentStats.total_users) || 0,
      current_instances: parseInt(currentStats.total_instances) || 0,
      current_connections: parseInt(currentStats.total_connections) || 0,
      current_agents: parseInt(currentStats.total_agents) || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar limites:", error)
    return null
  }
}
