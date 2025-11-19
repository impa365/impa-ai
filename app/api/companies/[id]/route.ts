// ================================================
// API Route: /api/companies/[id]
// Gerencia uma empresa específica
// ================================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/companies/[id] - Buscar empresa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    const userCompanyId = request.headers.get('x-user-company-id');
    
    // Super admin pode ver qualquer empresa
    // Admin pode ver apenas sua própria empresa
    if (userRole !== 'super_admin' && userCompanyId !== params.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }
    
    const query = `
      SELECT c.*, 
             cs.current_users, cs.current_agents, cs.current_connections, cs.current_integrations,
             cs.users_usage_percent, cs.agents_usage_percent, 
             cs.connections_usage_percent, cs.integrations_usage_percent
      FROM impaai.companies c
      LEFT JOIN impaai.company_stats cs ON c.id = cs.company_id
      WHERE c.id = $1
    `;
    
    const result = await pool.query(query, [params.id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar empresa' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] - Atualizar empresa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userCompanyId = request.headers.get('x-user-company-id');
    const userId = request.headers.get('x-user-id');
    
    // Super admin pode atualizar qualquer empresa
    // Admin pode atualizar apenas sua própria empresa (com limitações)
    if (userRole !== 'super_admin' && userCompanyId !== params.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Admin não pode alterar limites de recursos
    if (userRole === 'admin') {
      delete body.max_users;
      delete body.max_agents;
      delete body.max_connections;
      delete body.max_integrations;
      delete body.max_monthly_messages;
      delete body.resource_limits;
      delete body.status;
      delete body.subscription_plan;
    }
    
    // Construir query dinâmica
    const allowedFields = [
      'name', 'email', 'phone', 'document', 'address', 'city', 'state', 
      'country', 'zip_code', 'logo_url', 'primary_color', 'secondary_color',
      'settings', 'metadata'
    ];
    
    if (userRole === 'super_admin') {
      allowedFields.push(
        'max_users', 'max_agents', 'max_connections', 'max_integrations',
        'max_monthly_messages', 'resource_limits', 'status', 'subscription_plan',
        'subscription_expires_at'
      );
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'settings' || field === 'metadata' || field === 'resource_limits') {
          updates.push(`${field} = $${paramCount}`);
          values.push(JSON.stringify(body[field]));
        } else {
          updates.push(`${field} = $${paramCount}`);
          values.push(body[field]);
        }
        paramCount++;
      }
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
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
        'company_updated',
        `Empresa atualizada`,
        JSON.stringify({ updated_fields: Object.keys(body) })
      ]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating company:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar empresa' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] - Deletar empresa (Super Admin apenas)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas Super Admins podem deletar empresas.' },
        { status: 403 }
      );
    }
    
    // Verificar se empresa existe e tem recursos associados
    const checkQuery = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM impaai.user_profiles WHERE company_id = c.id) as users_count,
        (SELECT COUNT(*) FROM impaai.ai_agents WHERE company_id = c.id) as agents_count,
        (SELECT COUNT(*) FROM impaai.whatsapp_connections WHERE company_id = c.id) as connections_count
      FROM impaai.companies c
      WHERE c.id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [params.id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }
    
    const company = checkResult.rows[0];
    
    // Avisar se há recursos associados
    if (company.users_count > 0 || company.agents_count > 0 || company.connections_count > 0) {
      return NextResponse.json(
        { 
          error: 'Empresa possui recursos associados',
          details: {
            users: company.users_count,
            agents: company.agents_count,
            connections: company.connections_count
          },
          message: 'Remova todos os recursos antes de deletar a empresa, ou use force=true'
        },
        { status: 400 }
      );
    }
    
    // Deletar empresa
    await pool.query('DELETE FROM impaai.companies WHERE id = $1', [params.id]);
    
    // Log da atividade
    await pool.query(
      `INSERT INTO impaai.company_activity_logs (company_id, user_id, action, description)
       VALUES ($1, $2, $3, $4)`,
      [params.id, userId, 'company_deleted', `Empresa ${company.name} deletada`]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar empresa' },
      { status: 500 }
    );
  }
}
