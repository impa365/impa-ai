import { NextRequest, NextResponse } from "next/server";
import { getCurrentServerUser } from "@/lib/auth-server";
import { 
  generateUltraSecureToken, 
  validatePasswordStrength, 
  hashPasswordSecure, 
  checkRateLimit,
  sanitizeIP,
  getSecurityHeaders,
  logSecurityEvent
} from "./security-utils";



// GET - Listar links compartilhados do usuário
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [SHARED-LINKS] Buscando links compartilhados...");

    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [SHARED-LINKS] Configuração Supabase ausente");
      return NextResponse.json(
        { success: false, error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Buscar links do usuário com informações da conexão
    const response = await fetch(
      `${supabaseUrl}/rest/v1/shared_whatsapp_links?user_id=eq.${user.id}&is_active=eq.true&order=created_at.desc&select=*,whatsapp_connections(id,connection_name,instance_name,status)`,
      { headers }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [SHARED-LINKS] Erro ao buscar links:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: "Erro ao buscar links" },
        { status: 500 }
      );
    }

    const links = await response.json();
    console.log(`✅ [SHARED-LINKS] ${links?.length || 0} links encontrados`);
    
    // Debug: verificar estrutura dos links
    if (links && links.length > 0) {
      console.log("🔍 [SHARED-LINKS] Estrutura do primeiro link:", {
        id: links[0].id?.substring(0, 8) + '...',
        connection_id: links[0].connection_id?.substring(0, 8) + '...',
        has_connection_data: !!links[0].whatsapp_connections,
        connection_keys: links[0].whatsapp_connections ? Object.keys(links[0].whatsapp_connections) : 'null',
        connection_name: links[0].whatsapp_connections?.connection_name || 'MISSING'
      });
    }

    // Filtrar dados sensíveis
    const safeLinks = links?.map((link: any) => ({
      id: link.id,
      connection_id: link.connection_id,
      user_id: link.user_id,
      token: link.token,
      password_hash: link.password_hash, // Incluir para verificação no frontend
      salt: link.salt, // Incluir para verificação no frontend
      permissions: link.permissions,
      expires_at: link.expires_at,
      max_uses: link.max_uses,
      current_uses: link.current_uses,
      is_active: link.is_active,
      last_accessed_at: link.last_accessed_at,
      created_at: link.created_at,
      updated_at: link.updated_at,
      connection: link.whatsapp_connections, // Mapear conexão para formato esperado
      share_url: `${request.headers.get('origin') || 'http://localhost:3000'}/shared/whatsapp/${link.token}`
    })) || [];

    return NextResponse.json({
      success: true,
      data: safeLinks
    });

  } catch (error: any) {
    console.error("💥 [SHARED-LINKS] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar novo link compartilhado
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let securityHeaders = {};
  
  try {
    console.log("📝 [SHARED-LINKS] Criando novo link compartilhado...");

    // Aplicar headers de segurança
    securityHeaders = getSecurityHeaders();

    // Sanitizar IP e aplicar rate limiting
    const clientIP = sanitizeIP(request);
    const rateCheck = checkRateLimit(clientIP);
    
    if (!rateCheck.allowed) {
      logSecurityEvent({
        type: 'RATE_LIMIT',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { resetTime: rateCheck.resetTime }
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Muitas tentativas. Tente novamente em alguns minutos.",
          code: "RATE_LIMITED"
        },
        { 
          status: 429,
          headers: {
            ...securityHeaders,
            'Retry-After': '60'
          }
        }
      );
    }

    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      logSecurityEvent({
        type: 'FAILED_AUTH',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { reason: 'No authentication' }
      });
      
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401, headers: securityHeaders }
      );
    }

    const body = await request.json();
    const { 
      connection_id,
      password,
      permissions,
      expires_in_hours,
      max_uses
    } = body;

    console.log("📋 [SHARED-LINKS] Dados recebidos:", {
      connection_id,
      password_length: password?.length || 0,
      permissions,
      expires_in_hours,
      max_uses,
      user_id: user.id
    });

    // Validações de entrada
    if (!connection_id) {
      return NextResponse.json(
        { success: false, error: "ID da conexão é obrigatório" },
        { status: 400, headers: securityHeaders }
      );
    }

    // Definir has_password baseado na presença da senha
    const hasPassword = !!(password && password.trim());

    console.log("📋 [SHARED-LINKS] Dados de processamento:", {
      password_length: password?.length || 0,
      hasPassword,
      permissions,
      expires_in_hours,
      max_uses
    });

    // Validações de segurança
    if (!connection_id || typeof connection_id !== 'string') {
      return NextResponse.json(
        { success: false, error: "connection_id é obrigatório e deve ser uma string válida" },
        { status: 400, headers: securityHeaders }
      );
    }

    // Validar senha se fornecida
    let passwordHash = null;
    let passwordSalt = null;
    
    if (hasPassword && password) {
      console.log("🔐 [SHARED-LINKS] Validando senha fornecida...");
      
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        console.log("❌ [SHARED-LINKS] Senha não atende aos critérios:", passwordValidation.errors);
        
        logSecurityEvent({
          type: 'FAILED_AUTH',
          ip: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown',
          details: { 
            reason: 'Weak password',
            errors: passwordValidation.errors,
            action: 'CREATE_SHARED_LINK'
          }
        });

        return NextResponse.json({
          success: false,
          error: `Senha muito fraca: ${passwordValidation.errors.join(', ')}`,
          code: "WEAK_PASSWORD"
        }, { status: 400, headers: securityHeaders });
      }

      console.log("✅ [SHARED-LINKS] Senha válida, gerando hash...");
      
      try {
        const hashResult = hashPasswordSecure(password);
        passwordHash = hashResult.hash;
        passwordSalt = hashResult.salt;
        console.log("✅ [SHARED-LINKS] Hash da senha gerado com sucesso");
      } catch (hashError) {
        console.error("❌ [SHARED-LINKS] Erro ao gerar hash da senha:", hashError);
        return NextResponse.json({
          success: false,
          error: "Erro interno ao processar senha",
          code: "HASH_ERROR"
        }, { status: 500, headers: securityHeaders });
      }
    } else {
      console.log("ℹ️ [SHARED-LINKS] Nenhuma senha fornecida");
    }

    // Validar permissões
    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json(
        { success: false, error: "Permissões inválidas" },
        { status: 400, headers: securityHeaders }
      );
    }

    // Validar limites
    if (expires_in_hours && (expires_in_hours < 1 || expires_in_hours > 8760)) { // Max 1 ano
      return NextResponse.json(
        { success: false, error: "Expiração deve ser entre 1 hora e 1 ano" },
        { status: 400, headers: securityHeaders }
      );
    }

    if (max_uses && (max_uses < 1 || max_uses > 1000)) {
      return NextResponse.json(
        { success: false, error: "Limite de usos deve ser entre 1 e 1000" },
        { status: 400, headers: securityHeaders }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [SHARED-LINKS] Configuração Supabase ausente");
      return NextResponse.json(
        { success: false, error: "Configuração do servidor incompleta" },
        { status: 500, headers: securityHeaders }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Verificar se a conexão pertence ao usuário
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connection_id}&user_id=eq.${user.id}&select=id,user_id,connection_name`,
      { headers }
    );

    if (!connectionResponse.ok) {
      console.error("❌ [SHARED-LINKS] Erro ao verificar conexão:", connectionResponse.status);
      return NextResponse.json(
        { success: false, error: "Erro ao verificar conexão" },
        { status: 500, headers: securityHeaders }
      );
    }

    const connections = await connectionResponse.json();
    if (!connections || connections.length === 0) {
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { 
          reason: 'Attempt to create link for non-owned connection',
          connection_id,
          user_id: user.id
        }
      });
      
      console.error("❌ [SHARED-LINKS] Conexão não encontrada ou sem permissão");
      return NextResponse.json(
        { success: false, error: "Conexão não encontrada ou sem permissão" },
        { status: 404, headers: securityHeaders }
      );
    }

    // Gerar token ultra-seguro
    const token = generateUltraSecureToken();

    // Preparar dados para inserção
    let password_hash = null;
    let salt = null;

    if (password) {
      const passwordData = hashPasswordSecure(password);
      password_hash = passwordData.hash;
      salt = passwordData.salt;
    }

    // Calcular data de expiração
    let expires_at = null;
    if (expires_in_hours && expires_in_hours > 0) {
      expires_at = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString();
    }

    // Criar link compartilhado
    const insertData = {
      connection_id,
      user_id: user.id,
      token,
      password_hash: passwordHash,
      salt: passwordSalt,
      permissions,
      expires_at,
      max_uses
    };

    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/shared_whatsapp_links`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Prefer": "return=representation"
        },
        body: JSON.stringify(insertData)
      }
    );

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error("❌ [SHARED-LINKS] Erro ao criar link:", insertResponse.status, errorText);
      return NextResponse.json(
        { success: false, error: "Erro ao criar link compartilhado" },
        { status: 500, headers: securityHeaders }
      );
    }

    const newLinks = await insertResponse.json();
    const newLink = newLinks[0];

    console.log("✅ [SHARED-LINKS] Link criado com sucesso:", newLink.id);

    // Log de sucesso
    logSecurityEvent({
      type: 'ACCESS_ATTEMPT',
      ip: clientIP,
      userAgent: request.headers.get('user-agent') || 'unknown',
      token: newLink.token,
      details: { 
        action: 'CREATE_LINK',
        user_id: user.id,
        connection_id,
        has_password: !!password,
        expires_at,
        processing_time: Date.now() - startTime
      }
    });

    // Buscar dados completos com join
    const fullLinkResponse = await fetch(
      `${supabaseUrl}/rest/v1/shared_whatsapp_links?id=eq.${newLink.id}&select=*,whatsapp_connections(id,connection_name,instance_name,status)`,
      { headers }
    );

    let linkWithConnection = newLink;
    if (fullLinkResponse.ok) {
      const fullLinks = await fullLinkResponse.json();
      if (fullLinks && fullLinks.length > 0) {
        linkWithConnection = fullLinks[0];
      }
    }

    // Retornar dados seguros
    const safeLink = {
      id: linkWithConnection.id,
      connection_id: linkWithConnection.connection_id,
      connection: linkWithConnection.whatsapp_connections || connections[0],
      token: linkWithConnection.token,
      permissions: linkWithConnection.permissions,
      expires_at: linkWithConnection.expires_at,
      max_uses: linkWithConnection.max_uses,
      current_uses: linkWithConnection.current_uses,
      share_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/shared/whatsapp/${linkWithConnection.token}`,
      created_at: linkWithConnection.created_at,
      security_level: password ? 'HIGH' : 'MEDIUM' // Indicador de nível de segurança
    };

    return NextResponse.json({
      success: true,
      data: safeLink,
      message: "Link compartilhado criado com sucesso!"
    }, { headers: securityHeaders });

  } catch (error: any) {
    console.error("💥 [SHARED-LINKS] Erro:", error);
    
    logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      ip: sanitizeIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { 
        error: error.message,
        stack: error.stack?.substring(0, 200),
        processing_time: Date.now() - startTime
      }
    });
    
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500, headers: securityHeaders }
    );
  }
}

// DELETE - Deletar/desativar link compartilhado
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ [SHARED-LINKS] Deletando link compartilhado...");

    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');

    if (!linkId) {
      return NextResponse.json(
        { success: false, error: "ID do link é obrigatório" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [SHARED-LINKS] Configuração Supabase ausente");
      return NextResponse.json(
        { success: false, error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Verificar se o link pertence ao usuário e desativar
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/shared_whatsapp_links?id=eq.${linkId}&user_id=eq.${user.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("❌ [SHARED-LINKS] Erro ao deletar link:", updateResponse.status, errorText);
      return NextResponse.json(
        { success: false, error: "Erro ao deletar link" },
        { status: 500 }
      );
    }

    console.log("✅ [SHARED-LINKS] Link deletado com sucesso:", linkId);

    return NextResponse.json({
      success: true,
      message: "Link compartilhado removido com sucesso!"
    });

  } catch (error: any) {
    console.error("💥 [SHARED-LINKS] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 

// PUT - Editar link compartilhado existente
export async function PUT(request: NextRequest) {
  try {
    console.log("📝 [SHARED-LINKS] Editando link compartilhado...");

    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar rate limiting
    const clientIP = sanitizeIP(request);
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      logSecurityEvent({
        type: 'RATE_LIMIT',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || '',
        details: { action: 'EDIT_SHARED_LINK' }
      });
      
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Tente novamente em alguns minutos." },
        { 
          status: 429,
          headers: getSecurityHeaders()
        }
      );
    }

    // Obter ID do link da query string
    const url = new URL(request.url);
    const linkId = url.searchParams.get('id');
    
    if (!linkId) {
      return NextResponse.json(
        { success: false, error: "ID do link é obrigatório" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("📋 [SHARED-LINKS] Dados de edição recebidos:", {
      linkId: linkId.substring(0, 8) + '...',
      password_length: body.password?.length || 0,
      permissions: body.permissions,
      expires_in_hours: body.expires_in_hours,
      max_uses: body.max_uses
    });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [SHARED-LINKS] Configuração Supabase ausente");
      return NextResponse.json(
        { success: false, error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Primeiro, verificar se o link existe e pertence ao usuário
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/shared_whatsapp_links?id=eq.${linkId}&user_id=eq.${user.id}`,
      {
        method: "GET",
        headers
      }
    );

    if (!checkResponse.ok) {
      console.error("❌ [SHARED-LINKS] Erro ao verificar link:", checkResponse.status);
      return NextResponse.json(
        { success: false, error: "Erro ao verificar link" },
        { status: 500 }
      );
    }

    const existingLinks = await checkResponse.json();
    if (!existingLinks || existingLinks.length === 0) {
      return NextResponse.json(
        { success: false, error: "Link não encontrado ou não autorizado" },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {
      permissions: body.permissions,
      updated_at: new Date().toISOString()
    };

    // Se uma nova senha foi fornecida, validar e criptografar
    if (body.password && body.password.trim() !== '') {
      console.log("🔐 [SHARED-LINKS] Validando nova senha...");
      
      const passwordValidation = validatePasswordStrength(body.password);
      if (!passwordValidation.valid) {
        console.log("❌ [SHARED-LINKS] Senha não atende aos critérios:", passwordValidation.errors);
        
        await logSecurityEvent({
          type: 'FAILED_AUTH',
          ip: clientIP,
          userAgent: request.headers.get('user-agent') || '',
          details: {
            reason: 'Weak password',
            errors: passwordValidation.errors,
            action: 'EDIT_SHARED_LINK'
          }
        });

        return NextResponse.json(
          { 
            success: false, 
            error: "Senha não atende aos critérios de segurança",
            code: "WEAK_PASSWORD",
            details: passwordValidation.errors
          },
          { 
            status: 400,
            headers: getSecurityHeaders()
          }
        );
      }

      const { hash, salt } = await hashPasswordSecure(body.password);
      updateData.password_hash = hash;
      updateData.salt = salt;
    }

    // Configurar expiração
    if (body.expires_in_hours) {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + body.expires_in_hours);
      updateData.expires_at = expirationDate.toISOString();
    } else {
      updateData.expires_at = null;
    }

    // Configurar limite de usos
    updateData.max_uses = body.max_uses || null;

    console.log("🔄 [SHARED-LINKS] Atualizando link:", linkId.substring(0, 8) + '...');

    // Atualizar o link
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/shared_whatsapp_links?id=eq.${linkId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(updateData),
      }
    );

    if (!updateResponse.ok) {
      const errorBody = await updateResponse.text();
      console.error("❌ [SHARED-LINKS] Erro ao atualizar link:", updateResponse.status, errorBody);
      return NextResponse.json(
        { success: false, error: "Erro ao atualizar link" },
        { status: 500 }
      );
    }

    // Buscar o link atualizado com informações da conexão
    const fetchResponse = await fetch(
      `${supabaseUrl}/rest/v1/shared_whatsapp_links?id=eq.${linkId}&select=*,whatsapp_connections(id,connection_name,instance_name,status)`,
      {
        method: "GET",
        headers
      }
    );

    if (!fetchResponse.ok) {
      console.error("❌ [SHARED-LINKS] Erro ao buscar link atualizado:", fetchResponse.status);
      return NextResponse.json(
        { success: false, error: "Erro ao buscar link atualizado" },
        { status: 500 }
      );
    }

    const updatedLinks = await fetchResponse.json();
    const updatedLink = updatedLinks[0];

    if (!updatedLink) {
      return NextResponse.json(
        { success: false, error: "Link atualizado não encontrado" },
        { status: 404 }
      );
    }

    // Debug: verificar estrutura do link atualizado
    console.log("🔍 [SHARED-LINKS] Link atualizado - estrutura:", {
      id: updatedLink.id?.substring(0, 8) + '...',
      connection_id: updatedLink.connection_id?.substring(0, 8) + '...',
      has_connection_data: !!updatedLink.whatsapp_connections,
      connection_keys: updatedLink.whatsapp_connections ? Object.keys(updatedLink.whatsapp_connections) : 'null',
      connection_name: updatedLink.whatsapp_connections?.connection_name || 'MISSING'
    });

    // Gerar URL de compartilhamento
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
    updatedLink.share_url = `${baseUrl}/shared/whatsapp/${updatedLink.token}`;

    // Mapear conexão para formato esperado pelo frontend
    if (updatedLink.whatsapp_connections) {
      updatedLink.connection = updatedLink.whatsapp_connections;
    }

    await logSecurityEvent({
      type: 'ACCESS_ATTEMPT',
      ip: clientIP,
      userAgent: request.headers.get('user-agent') || '',
      details: {
        action: 'EDIT_SHARED_LINK_SUCCESS',
        link_id: linkId.substring(0, 8) + '...',
        user_id: user.id
      }
    });

    console.log("✅ [SHARED-LINKS] Link atualizado com sucesso:", linkId.substring(0, 8) + '...');

    return NextResponse.json(
      { 
        success: true, 
        data: updatedLink 
      },
      { 
        status: 200,
        headers: getSecurityHeaders()
      }
    );

  } catch (error) {
    console.error("💥 [SHARED-LINKS] Erro fatal ao editar link:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    );
  }
} 