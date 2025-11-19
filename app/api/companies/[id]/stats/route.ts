// ================================================
// API Route: /api/companies/[id]/stats
// Estatísticas e dashboard da empresa
// ================================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/companies/[id]/stats - Buscar estatísticas da empresa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userCompanyId = request.headers.get('x-user-company-id');
    
    // Verificar permissão
    if (userRole !== 'super_admin' && userCompanyId !== params.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }
    
    // Buscar dados da empresa com estatísticas
    const companyQuery = `
      SELECT * FROM impaai.company_stats
      WHERE company_id = $1
    `;
    
    const companyResult = await pool.query(companyQuery, [params.id]);
    
    if (companyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }
    
    const stats = companyResult.rows[0];
    
    // Buscar atividades recentes
    const activitiesQuery = `
      SELECT 
        cal.id,
        cal.action,
        cal.resource_type,
        cal.description,
        cal.created_at,
        up.full_name as user_name,
        up.email as user_email
      FROM impaai.company_activity_logs cal
      LEFT JOIN impaai.user_profiles up ON cal.user_id = up.id
      WHERE cal.company_id = $1
      ORDER BY cal.created_at DESC
      LIMIT 20
    `;
    
    const activitiesResult = await pool.query(activitiesQuery, [params.id]);
    
    // Buscar uso de recursos do mês atual
    const usageQuery = `
      SELECT *
      FROM impaai.company_resource_usage
      WHERE company_id = $1
        AND period_start = DATE_TRUNC('month', CURRENT_DATE)
      LIMIT 1
    `;
    
    const usageResult = await pool.query(usageQuery, [params.id]);
    
    // Buscar agentes ativos/inativos
    const agentsStatsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_agents,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_agents,
        COUNT(*) as total_agents
      FROM impaai.ai_agents
      WHERE company_id = $1
    `;
    
    const agentsStatsResult = await pool.query(agentsStatsQuery, [params.id]);
    
    // Buscar conexões por status
    const connectionsStatsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'connected') as connected,
        COUNT(*) FILTER (WHERE status = 'disconnected') as disconnected,
        COUNT(*) as total
      FROM impaai.whatsapp_connections
      WHERE company_id = $1
    `;
    
    const connectionsStatsResult = await pool.query(connectionsStatsQuery, [params.id]);
    
    // Identificar recursos próximos do limite
    const approachingLimits = [];
    
    if (stats.users_usage_percent >= 80) {
      approachingLimits.push({
        resource: 'Usuários',
        current: stats.current_users,
        max: stats.max_users,
        percent: stats.users_usage_percent,
      });
    }
    
    if (stats.agents_usage_percent >= 80) {
      approachingLimits.push({
        resource: 'Agentes',
        current: stats.current_agents,
        max: stats.max_agents,
        percent: stats.agents_usage_percent,
      });
    }
    
    if (stats.connections_usage_percent >= 80) {
      approachingLimits.push({
        resource: 'Conexões',
        current: stats.current_connections,
        max: stats.max_connections,
        percent: stats.connections_usage_percent,
      });
    }
    
    if (stats.integrations_usage_percent >= 80) {
      approachingLimits.push({
        resource: 'Integrações',
        current: stats.current_integrations,
        max: stats.max_integrations,
        percent: stats.integrations_usage_percent,
      });
    }
    
    return NextResponse.json({
      stats,
      recent_activities: activitiesResult.rows,
      resource_usage: usageResult.rows[0] || null,
      agents_stats: agentsStatsResult.rows[0],
      connections_stats: connectionsStatsResult.rows[0],
      approaching_limits: approachingLimits,
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
