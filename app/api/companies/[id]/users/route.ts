// ================================================
// API Route: /api/companies/[id]/users
// Gerencia usuários de uma empresa
// ================================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/companies/[id]/users - Listar usuários da empresa
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
        id, full_name, email, role, status, phone, avatar_url,
        company_id, can_create_users, can_manage_company,
        agents_limit, connections_limit, monthly_messages_limit,
        custom_permissions, preferences, timezone, language,
        last_login_at, login_count, created_at, updated_at
      FROM impaai.user_profiles
      WHERE company_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [params.id]);
    
    return NextResponse.json({
      users: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching company users:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

// POST /api/companies/[id]/users - Criar usuário na empresa
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userCompanyId = request.headers.get('x-user-company-id');
    const userId = request.headers.get('x-user-id');
    
    // Verificar permissão
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }
    
    // Admin só pode criar na própria empresa
    if (userRole === 'admin' && userCompanyId !== params.id) {
      return NextResponse.json(
        { error: 'Você só pode criar usuários na sua própria empresa' },
        { status: 403 }
      );
    }
    
    // Verificar limite de usuários
    const limitCheck = await pool.query(
      'SELECT impaai.check_company_resource_limit($1, $2) as can_create',
      [params.id, 'users']
    );
    
    if (!limitCheck.rows[0].can_create) {
      return NextResponse.json(
        { error: 'Limite de usuários atingido para esta empresa' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      full_name,
      email,
      password,
      role = 'user',
      phone,
      can_create_users = false,
      can_manage_company = false,
      agents_limit = 3,
      connections_limit = 5,
      monthly_messages_limit = 1000,
    } = body;
    
    // Validações
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      );
    }
    
    // Admin não pode criar super_admin
    if (userRole === 'admin' && role === 'super_admin') {
      return NextResponse.json(
        { error: 'Apenas Super Admins podem criar outros Super Admins' },
        { status: 403 }
      );
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserir usuário
    const insertQuery = `
      INSERT INTO impaai.user_profiles (
        company_id, full_name, email, password, role, phone,
        can_create_users, can_manage_company,
        agents_limit, connections_limit, monthly_messages_limit,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active'
      )
      RETURNING 
        id, full_name, email, role, status, phone, avatar_url,
        company_id, can_create_users, can_manage_company,
        agents_limit, connections_limit, monthly_messages_limit,
        created_at, updated_at
    `;
    
    const values = [
      params.id,
      full_name,
      email,
      hashedPassword,
      role,
      phone,
      can_create_users,
      can_manage_company,
      agents_limit,
      connections_limit,
      monthly_messages_limit,
    ];
    
    const result = await pool.query(insertQuery, values);
    const newUser = result.rows[0];
    
    // Atualizar contadores de uso
    await pool.query('SELECT impaai.update_company_resource_usage($1)', [params.id]);
    
    // Log da atividade
    await pool.query(
      `INSERT INTO impaai.company_activity_logs (company_id, user_id, action, resource_type, resource_id, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.id,
        userId,
        'user_created',
        'user',
        newUser.id,
        `Usuário ${full_name} (${email}) criado`
      ]
    );
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
