// ================================================
// Middleware de Autorização Multi-level
// Verifica permissões baseado em roles e company_id
// ================================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  company_id?: string;
}

// Verificar e decodificar token JWT
export function verifyToken(token: string): DecodedToken | null {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.verify(token, secret) as DecodedToken;
  } catch (error) {
    return null;
  }
}

// Middleware principal de autorização
export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json(
      { error: 'Token não fornecido' },
      { status: 401 }
    );
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 401 }
    );
  }
  
  // Buscar informações completas do usuário
  const userQuery = `
    SELECT 
      id, email, full_name, role, status, company_id,
      can_create_users, can_manage_company, custom_permissions
    FROM impaai.user_profiles
    WHERE id = $1
  `;
  
  const result = await pool.query(userQuery, [decoded.userId]);
  
  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: 'Usuário não encontrado' },
      { status: 404 }
    );
  }
  
  const user = result.rows[0];
  
  if (user.status !== 'active') {
    return NextResponse.json(
      { error: 'Usuário inativo' },
      { status: 403 }
    );
  }
  
  // Adicionar informações do usuário aos headers da requisição
  const headers = new Headers(request.headers);
  headers.set('x-user-id', user.id);
  headers.set('x-user-email', user.email);
  headers.set('x-user-role', user.role);
  headers.set('x-user-company-id', user.company_id || '');
  headers.set('x-user-can-create-users', user.can_create_users.toString());
  headers.set('x-user-can-manage-company', user.can_manage_company.toString());
  
  return { user, headers };
}

// Verificar se usuário tem permissão para acessar recurso
export function checkPermission(
  userRole: string,
  userCompanyId: string | null,
  resourceCompanyId: string,
  action: 'read' | 'write' | 'delete'
): boolean {
  // Super Admin tem acesso total
  if (userRole === 'super_admin') {
    return true;
  }
  
  // Admin tem acesso total dentro da própria empresa
  if (userRole === 'admin' && userCompanyId === resourceCompanyId) {
    return true;
  }
  
  // Usuário normal só tem acesso de leitura na própria empresa
  if (userRole === 'user' && userCompanyId === resourceCompanyId && action === 'read') {
    return true;
  }
  
  return false;
}

// Verificar se pode criar recurso (verificando limites)
export async function checkResourceCreation(
  companyId: string,
  resourceType: 'users' | 'agents' | 'connections' | 'integrations'
): Promise<{ can: boolean; reason?: string }> {
  try {
    const result = await pool.query(
      'SELECT impaai.check_company_resource_limit($1, $2) as can_create',
      [companyId, resourceType]
    );
    
    if (!result.rows[0].can_create) {
      return {
        can: false,
        reason: `Limite de ${resourceType} atingido para esta empresa`,
      };
    }
    
    return { can: true };
  } catch (error) {
    console.error('Error checking resource limit:', error);
    return {
      can: false,
      reason: 'Erro ao verificar limite de recursos',
    };
  }
}

// Wrapper para proteger rotas
export function requireAuth(handler: Function, options?: {
  requiredRole?: 'super_admin' | 'admin' | 'user';
  checkCompanyAccess?: boolean;
}) {
  return async (request: NextRequest, context?: any) => {
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Retorna erro de auth
    }
    
    const { user, headers } = authResult;
    
    // Verificar role mínima necessária
    if (options?.requiredRole) {
      const roleHierarchy = {
        'super_admin': 3,
        'admin': 2,
        'user': 1,
      };
      
      const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
      const requiredLevel = roleHierarchy[options.requiredRole];
      
      if (userLevel < requiredLevel) {
        return NextResponse.json(
          { error: 'Permissão insuficiente' },
          { status: 403 }
        );
      }
    }
    
    // Verificar acesso à empresa (se necessário)
    if (options?.checkCompanyAccess && context?.params?.id) {
      const canAccess = checkPermission(
        user.role,
        user.company_id,
        context.params.id,
        'read'
      );
      
      if (!canAccess) {
        return NextResponse.json(
          { error: 'Acesso negado a esta empresa' },
          { status: 403 }
        );
      }
    }
    
    // Criar nova requisição com headers atualizados
    const newRequest = new NextRequest(request.url, {
      method: request.method,
      headers,
      body: request.body,
    });
    
    // Chamar handler original
    return handler(newRequest, context);
  };
}

// Verificar permissão customizada
export function hasCustomPermission(
  customPermissions: Record<string, any>,
  permission: string
): boolean {
  return customPermissions && customPermissions[permission] === true;
}

// Log de atividade
export async function logActivity(
  companyId: string,
  userId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  description?: string,
  metadata?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await pool.query(
      `INSERT INTO impaai.company_activity_logs 
       (company_id, user_id, action, resource_type, resource_id, description, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        companyId,
        userId,
        action,
        resourceType,
        resourceId,
        description,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent,
      ]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Exportar funções auxiliares
export { DecodedToken };
