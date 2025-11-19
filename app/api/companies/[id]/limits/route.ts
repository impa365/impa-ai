// ================================================
// API Route: /api/companies/[id]/limits
// Verifica e gerencia limites de recursos da empresa
// ================================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { ResourceLimitCheck } from '@/types/company';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/companies/[id]/limits - Verificar todos os limites
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
    
    const query = `
      SELECT 
        c.id as company_id,
        c.name as company_name,
        c.max_users,
        c.max_agents,
        c.max_connections,
        c.max_integrations,
        c.max_monthly_messages,
        (SELECT COUNT(*) FROM impaai.user_profiles WHERE company_id = c.id) as current_users,
        (SELECT COUNT(*) FROM impaai.ai_agents WHERE company_id = c.id) as current_agents,
        (SELECT COUNT(*) FROM impaai.whatsapp_connections WHERE company_id = c.id) as current_connections,
        (SELECT COUNT(*) FROM impaai.integrations WHERE company_id = c.id) as current_integrations,
        COALESCE(
          (SELECT monthly_messages 
           FROM impaai.company_resource_usage 
           WHERE company_id = c.id 
             AND period_start = DATE_TRUNC('month', CURRENT_DATE)
           LIMIT 1
          ), 0
        ) as current_monthly_messages
      FROM impaai.companies c
      WHERE c.id = $1
    `;
    
    const result = await pool.query(query, [params.id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }
    
    const data = result.rows[0];
    
    // Calcular limites para cada recurso
    const limits: Record<string, ResourceLimitCheck> = {
      users: {
        company_id: data.company_id,
        resource_type: 'users',
        current_count: data.current_users,
        max_limit: data.max_users,
        can_create: data.current_users < data.max_users,
        usage_percent: Math.round((data.current_users / data.max_users) * 100),
      },
      agents: {
        company_id: data.company_id,
        resource_type: 'agents',
        current_count: data.current_agents,
        max_limit: data.max_agents,
        can_create: data.current_agents < data.max_agents,
        usage_percent: Math.round((data.current_agents / data.max_agents) * 100),
      },
      connections: {
        company_id: data.company_id,
        resource_type: 'connections',
        current_count: data.current_connections,
        max_limit: data.max_connections,
        can_create: data.current_connections < data.max_connections,
        usage_percent: Math.round((data.current_connections / data.max_connections) * 100),
      },
      integrations: {
        company_id: data.company_id,
        resource_type: 'integrations',
        current_count: data.current_integrations,
        max_limit: data.max_integrations,
        can_create: data.current_integrations < data.max_integrations,
        usage_percent: Math.round((data.current_integrations / data.max_integrations) * 100),
      },
      messages: {
        company_id: data.company_id,
        resource_type: 'messages',
        current_count: data.current_monthly_messages,
        max_limit: data.max_monthly_messages,
        can_create: data.current_monthly_messages < data.max_monthly_messages,
        usage_percent: Math.round((data.current_monthly_messages / data.max_monthly_messages) * 100),
      },
    };
    
    return NextResponse.json({
      company_id: data.company_id,
      company_name: data.company_name,
      limits,
    });
  } catch (error) {
    console.error('Error checking limits:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar limites' },
      { status: 500 }
    );
  }
}

// POST /api/companies/[id]/limits - Verificar limite específico antes de criar recurso
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { resource_type } = await request.json();
    
    if (!['users', 'agents', 'connections', 'integrations'].includes(resource_type)) {
      return NextResponse.json(
        { error: 'Tipo de recurso inválido' },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      'SELECT impaai.check_company_resource_limit($1, $2) as can_create',
      [params.id, resource_type]
    );
    
    const can_create = result.rows[0].can_create;
    
    if (!can_create) {
      return NextResponse.json(
        { 
          can_create: false,
          error: `Limite de ${resource_type} atingido para esta empresa`
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ can_create: true });
  } catch (error) {
    console.error('Error checking resource limit:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar limite' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id]/limits - Atualizar limites (Super Admin apenas)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas Super Admins podem alterar limites.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      max_users,
      max_agents,
      max_connections,
      max_integrations,
      max_monthly_messages,
      resource_limits,
    } = body;
    
    // Construir query de atualização
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (max_users !== undefined) {
      updates.push(`max_users = $${paramCount}`);
      values.push(max_users);
      paramCount++;
    }
    
    if (max_agents !== undefined) {
      updates.push(`max_agents = $${paramCount}`);
      values.push(max_agents);
      paramCount++;
    }
    
    if (max_connections !== undefined) {
      updates.push(`max_connections = $${paramCount}`);
      values.push(max_connections);
      paramCount++;
    }
    
    if (max_integrations !== undefined) {
      updates.push(`max_integrations = $${paramCount}`);
      values.push(max_integrations);
      paramCount++;
    }
    
    if (max_monthly_messages !== undefined) {
      updates.push(`max_monthly_messages = $${paramCount}`);
      values.push(max_monthly_messages);
      paramCount++;
    }
    
    if (resource_limits !== undefined) {
      updates.push(`resource_limits = $${paramCount}`);
      values.push(JSON.stringify(resource_limits));
      paramCount++;
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum limite para atualizar' },
        { status: 400 }
      );
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(params.id);
    
    const query = `
      UPDATE impaai.companies
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }
    
    // Log da atividade
    await pool.query(
      `INSERT INTO impaai.company_activity_logs (company_id, user_id, action, description, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.id,
        userId,
        'limits_updated',
        'Limites de recursos atualizados',
        JSON.stringify(body)
      ]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating limits:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar limites' },
      { status: 500 }
    );
  }
}
