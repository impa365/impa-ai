import { NextRequest, NextResponse } from "next/server";
import { 
  checkRateLimit,
  sanitizeIP,
  getSecurityHeaders,
  logSecurityEvent,
  validateTokenFormat
} from "../../security-utils";
import { query, queryOne, queryMany } from "@/lib/db";

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

    // Buscar link compartilhado com informações da conexão
    const links = await queryMany(
      `SELECT sl.*,
        json_build_object(
          'id', wc.id,
          'instance_name', wc.instance_name,
          'status', wc.status
        ) as whatsapp_connections
      FROM shared_whatsapp_links sl
      LEFT JOIN whatsapp_connections wc ON wc.id = sl.connection_id
      WHERE sl.token = $1 AND sl.is_active = true`,
      [token]
    );
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
    const integration = await queryOne<{ config: any }>(
      `SELECT config FROM integrations WHERE type = $1 AND is_active = true LIMIT 1`,
      ["evolution_api"]
    );

    if (!integration) {
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada" },
        { status: 500, headers: securityHeaders }
      );
    }

    const evolutionConfig = integration.config;

    try {
      // Verificar status atual antes de tentar desconectar
      console.log("🔍 [DISCONNECT] Verificando status atual...");
      const statusResponse = await fetch(
        `${evolutionConfig.apiUrl}/instance/connectionState/${connection.instance_name}`,
        {
          method: "GET",
          headers: {
            apikey: evolutionConfig.apiKey,
          },
          signal: AbortSignal.timeout(8000)
        }
      );

      let currentStatus = "unknown";
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        currentStatus = statusData?.instance?.state || "unknown";
        console.log("📊 [DISCONNECT] Status atual na Evolution API:", currentStatus);
        
        // Se já está desconectado, apenas atualizar o banco
        if (currentStatus === "close" || !currentStatus || currentStatus === "disconnected") {
          console.log("ℹ️ [DISCONNECT] Instância já está desconectada, atualizando banco...");
          
          // Atualizar status no banco
          await query(
            `UPDATE whatsapp_connections SET status = $1, updated_at = $2 WHERE instance_name = $3`,
            ["disconnected", new Date().toISOString(), connection.instance_name]
          );

          return NextResponse.json({
            success: true,
            data: {
              instance_name: connection.instance_name,
              status: 'disconnected',
              message: "Instância já estava desconectada"
            }
          }, { headers: securityHeaders });
        }
      }
      
      // Desconectar via Evolution API se ainda estiver conectado
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
      
      // Atualizar status no banco após disconnect bem-sucedido
      try {
        await query(
          `UPDATE whatsapp_connections SET status = $1, updated_at = $2 WHERE instance_name = $3`,
          ["disconnected", new Date().toISOString(), connection.instance_name]
        );
        console.log("🔄 [DISCONNECT] Status atualizado no banco: disconnected");
      } catch (updateError) {
        console.warn("⚠️ [DISCONNECT] Erro ao atualizar status no banco:", updateError);
      }
      
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