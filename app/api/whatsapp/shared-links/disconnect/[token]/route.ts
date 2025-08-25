import { NextRequest, NextResponse } from "next/server";
import { 
  checkRateLimit,
  sanitizeIP,
  getSecurityHeaders,
  logSecurityEvent,
  validateTokenFormat
} from "../../security-utils";

// POST - Desconectar instância WhatsApp
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const startTime = Date.now();
  const securityHeaders = getSecurityHeaders();
  
  try {
    const { token } = await params;
    console.log("🔌 [DISCONNECT] Desconectando instância para token:", token.substring(0, 10) + "...");

    // Sanitizar IP e aplicar rate limiting
    const clientIP = sanitizeIP(request);
    const rateCheck = checkRateLimit(clientIP);
    
    if (!rateCheck.allowed) {
      logSecurityEvent({
        type: 'RATE_LIMIT',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { action: 'DISCONNECT' }
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

    // Validar formato do token
    if (!validateTokenFormat(token)) {
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { reason: 'Invalid token format for disconnect' }
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Token inválido",
          code: "INVALID_TOKEN"
        },
        { status: 400, headers: securityHeaders }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: "Configuração do servidor incompleta" },
        { status: 500, headers: securityHeaders }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    };

    // Buscar link compartilhado com informações da conexão
    const linkResponse = await fetch(
      `${supabaseUrl}/rest/v1/shared_whatsapp_links?token=eq.${token}&is_active=eq.true&select=*,whatsapp_connections(id,instance_name,status)`,
      { headers }
    );

    if (!linkResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao verificar link" },
        { status: 500, headers: securityHeaders }
      );
    }

    const links = await linkResponse.json();
    if (!links || links.length === 0) {
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { reason: 'Attempt to disconnect non-existent link' }
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Link não encontrado ou expirado",
          code: "LINK_NOT_FOUND"
        },
        { status: 404, headers: securityHeaders }
      );
    }

    const link = links[0];

    // Verificar se o link não expirou
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Link expirado",
          code: "LINK_EXPIRED"
        },
        { status: 410, headers: securityHeaders }
      );
    }

    // Verificar limite de usos
    if (link.max_uses && link.current_uses >= link.max_uses) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Limite de usos atingido",
          code: "USAGE_LIMIT_REACHED"
        },
        { status: 410, headers: securityHeaders }
      );
    }

    // Verificar se tem permissão para controlar a conexão
    if (!link.permissions?.qr_code) {
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { reason: 'Attempt to disconnect without permission' }
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Permissão negada para controlar a conexão",
          code: "PERMISSION_DENIED"
        },
        { status: 403, headers: securityHeaders }
      );
    }

    const connection = link.whatsapp_connections;
    if (!connection) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Conexão não encontrada",
          code: "CONNECTION_NOT_FOUND"
        },
        { status: 404, headers: securityHeaders }
      );
    }

    // Buscar configuração da Evolution API
    const integrationResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
      { headers }
    );

    if (!integrationResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Configuração da Evolution API não encontrada" },
        { status: 500, headers: securityHeaders }
      );
    }

    const integrations = await integrationResponse.json();
    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada" },
        { status: 500, headers: securityHeaders }
      );
    }

    const evolutionConfig = integrations[0].config;

    try {
      // Desconectar via Evolution API
      console.log("🔄 [DISCONNECT] Chamando Evolution API para desconectar...");
      console.log("🔗 [DISCONNECT] URL:", `${evolutionConfig.apiUrl}/instance/logout/${connection.instance_name}`);
      console.log("🔑 [DISCONNECT] ApiKey presente:", !!evolutionConfig.apiKey);
      
      const disconnectResponse = await fetch(
        `${evolutionConfig.apiUrl}/instance/logout/${connection.instance_name}`,
        {
          method: "DELETE",
          headers: {
            apikey: evolutionConfig.apiKey,
          },
          signal: AbortSignal.timeout(15000) // Timeout de 15 segundos
        }
      );

      console.log("📡 [DISCONNECT] Response status:", disconnectResponse.status);
      console.log("📡 [DISCONNECT] Response headers:", Object.fromEntries(disconnectResponse.headers.entries()));

      if (!disconnectResponse.ok) {
        const errorText = await disconnectResponse.text();
        console.error("❌ [DISCONNECT] Erro da Evolution API:", disconnectResponse.status, errorText);
        
        if (disconnectResponse.status === 404) {
          return NextResponse.json(
            { 
              success: false, 
              error: "Instância não encontrada na Evolution API",
              code: "INSTANCE_NOT_FOUND"
            },
            { status: 404, headers: securityHeaders }
          );
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: "Erro ao comunicar com Evolution API",
            code: "EVOLUTION_API_ERROR"
          },
          { status: 502, headers: securityHeaders }
        );
      }

      const disconnectData = await disconnectResponse.json();
      console.log("✅ [DISCONNECT] Evolution API response:", disconnectData);
      
      // Log de sucesso
      logSecurityEvent({
        type: 'ACCESS_ATTEMPT',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { 
          action: 'DISCONNECT_SUCCESS',
          instance_name: connection.instance_name,
          processing_time: Date.now() - startTime
        }
      });

      console.log("✅ [DISCONNECT] Instância desconectada com sucesso");
      return NextResponse.json({
        success: true,
        data: {
          instance_name: connection.instance_name,
          status: 'disconnected',
          message: "Instância desconectada com sucesso"
        }
      }, { headers: securityHeaders });

    } catch (evolutionError: any) {
      console.error("💥 [DISCONNECT] Erro ao chamar Evolution API:", evolutionError);
      
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { 
          error: evolutionError.message,
          action: 'DISCONNECT_FAILED'
        }
      });
      
      if (evolutionError.name === 'TimeoutError') {
        return NextResponse.json(
          { 
            success: false, 
            error: "Timeout ao desconectar. Tente novamente.",
            code: "TIMEOUT"
          },
          { status: 504, headers: securityHeaders }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Erro ao desconectar instância",
          code: "DISCONNECT_FAILED"
        },
        { status: 500, headers: securityHeaders }
      );
    }

  } catch (error: any) {
    console.error("💥 [DISCONNECT] Erro geral:", error);
    
    logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      ip: sanitizeIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      token: (await params).token,
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