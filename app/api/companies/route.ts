// ================================================
// API Route: GET /api/companies
// Lista todas as empresas (Super Admin apenas)
// ================================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { Company, CompanyQuery, CompanyListResponse } from '@/types/company';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Verificar autenticação (implementar com seu sistema de auth)
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas Super Admins podem listar empresas.' },
        { status: 403 }
      );
    }
    
    // Parâmetros de query
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';
    
    const offset = (page - 1) * per_page;
    
    // Construir query
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    
    // Query total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM impaai.companies
      ${whereClause}
    `;
    
    // Query de dados
    const dataQuery = `
      SELECT *
      FROM impaai.companies
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;
    
    params.push(per_page, offset);
    
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, -2)),
      pool.query(dataQuery, params),
    ]);
    
    const response: CompanyListResponse = {
      companies: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      per_page,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar empresas' },
      { status: 500 }
    );
  }
}

// ================================================
// POST /api/companies
// Cria uma nova empresa (Super Admin apenas)
// ================================================

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas Super Admins podem criar empresas.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    const {
      name,
      email,
      phone,
      document,
      address,
      city,
      state,
      country = 'Brasil',
      zip_code,
      max_users = 5,
      max_agents = 10,
      max_connections = 10,
      max_integrations = 5,
      max_monthly_messages = 10000,
      resource_limits = {},
      status = 'active',
      subscription_plan = 'basic',
      subscription_expires_at,
      logo_url,
      primary_color = '#3B82F6',
      secondary_color = '#10B981',
      settings = {},
      metadata = {},
    } = body;
    
    // Validações
    if (!name || name.length < 3) {
      return NextResponse.json(
        { error: 'Nome da empresa deve ter no mínimo 3 caracteres' },
        { status: 400 }
      );
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }
    
    // Inserir empresa
    const query = `
      INSERT INTO impaai.companies (
        name, email, phone, document, address, city, state, country, zip_code,
        max_users, max_agents, max_connections, max_integrations, max_monthly_messages,
        resource_limits, status, subscription_plan, subscription_expires_at,
        logo_url, primary_color, secondary_color, settings, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21, $22, $23
      )
      RETURNING *
    `;
    
    const values = [
      name, email, phone, document, address, city, state, country, zip_code,
      max_users, max_agents, max_connections, max_integrations, max_monthly_messages,
      JSON.stringify(resource_limits), status, subscription_plan, subscription_expires_at,
      logo_url, primary_color, secondary_color, JSON.stringify(settings), JSON.stringify(metadata),
    ];
    
    const result = await pool.query(query, values);
    const company: Company = result.rows[0];
    
    // Log da atividade
    const userId = request.headers.get('x-user-id');
    await pool.query(
      `INSERT INTO impaai.company_activity_logs (company_id, user_id, action, description)
       VALUES ($1, $2, $3, $4)`,
      [company.id, userId, 'company_created', `Empresa ${name} criada`]
    );
    
    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error('Error creating company:', error);
    
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar empresa' },
      { status: 500 }
    );
  }
}
