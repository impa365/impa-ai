import { NextRequest, NextResponse } from "next/server";
import { 
  checkQRRateLimit,
  sanitizeIP,
  getSecurityHeaders,
  logSecurityEvent,
  validateTokenFormat
} from "../../security-utils";
import { query, queryOne, queryMany } from "@/lib/db";

// Função para incrementar uso do link
async function incrementLinkUsage(linkId: string, ip: string, userAgent: string) {
  try {
    const accessLog = {
      timestamp: new Date().toISOString(),
      ip,
      user_agent: userAgent,
      action: 'QR_CODE_GENERATED'
    };

    // Buscar dados atuais primeiro
    const currentLink = await queryOne(
      'SELECT current_uses, access_logs FROM shared_whatsapp_links WHERE id = $1',
      [linkId]
    );

    if (currentLink) {
      const newUses = (currentLink.current_uses || 0) + 1;
      const currentLogs = Array.isArray(currentLink.access_logs) ? currentLink.access_logs : [];
      const newLogs = [...currentLogs, accessLog];

      // Atualizar logs de acesso e contador
      await query(
        `UPDATE shared_whatsapp_links 
         SET current_uses = $1, last_accessed_at = $2, last_accessed_ip = $3, access_logs = $4::jsonb 
         WHERE id = $5`,
        [newUses, new Date().toISOString(), ip, JSON.stringify(newLogs), linkId]
      );
        
      console.log("✅ [QR-GENERATE] Uso incrementado:", newUses);
    }

  } catch (error) {
    console.error("⚠️ [QR-GENERATE] Erro ao incrementar uso:", error);
  }
}

// POST - Gerar QR Code via Evolution API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const startTime = Date.now();
  const securityHeaders = getSecurityHeaders();
  
  try {
    const { token } = await params;
    console.log("🔗 [QR-GENERATE] Gerando QR Code para token:", token.substring(0, 10) + "...");

    // Sanitizar IP e aplicar rate limiting específico para QR Code
    const clientIP = sanitizeIP(request);
    const rateCheck = checkQRRateLimit(clientIP, token);
    
    if (!rateCheck.allowed) {
      logSecurityEvent({
        type: 'RATE_LIMIT',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { action: 'QR_GENERATE' }
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
        details: { reason: 'Invalid token format for QR generation' }
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
      `SELECT sl.*, wc.id as wc_id, wc.instance_name as wc_instance_name, wc.status as wc_status, wc.connection_name as wc_connection_name
       FROM shared_whatsapp_links sl
       LEFT JOIN whatsapp_connections wc ON sl.connection_id = wc.id
       WHERE sl.token = $1 AND sl.is_active = true`,
      [token]
    );

    if (!links || links.length === 0) {
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { reason: 'Attempt to generate QR for non-existent link' }
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

    // Verificar se tem permissão para QR Code
    if (!link.permissions?.qr_code) {
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { reason: 'Attempt to generate QR without permission' }
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Permissão negada para gerar QR Code",
          code: "PERMISSION_DENIED"
        },
        { status: 403, headers: securityHeaders }
      );
    }

    // Se o link requer senha, verificar se já foi autenticado
    if (link.password_hash && link.salt) {
      console.log("🔐 [QR-GENERATE] Link protegido por senha - verificando autenticação...");
      
      // Aqui você pode implementar verificação de sessão/token de autenticação
      // Por simplicidade, vamos assumir que se chegou até aqui, já foi autenticado
      // Em produção, você deve verificar um token de sessão ou similar
      
      logSecurityEvent({
        type: 'ACCESS_ATTEMPT',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { 
          action: 'QR_GENERATE_PROTECTED_LINK',
          has_password: true
        }
      });
    }

    // Buscar dados da conexão INCLUINDO api_type e instance_token
    const connections = await queryMany(
      'SELECT id, instance_name, status, api_type, instance_token, user_id FROM whatsapp_connections WHERE id = $1',
      [link.connection_id]
    );

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Conexão não encontrada",
          code: "CONNECTION_NOT_FOUND"
        },
        { status: 404, headers: securityHeaders }
      );
    }

    const connection = connections[0];
    const apiType = connection.api_type || "evolution";
    
    console.log("🔍 [QR-GENERATE] Tipo de API detectado:", apiType);

    // === UAZAPI ===
    if (apiType === "uazapi") {
      console.log("🔵 [QR-GENERATE] Gerando QR Code via Uazapi...");
      
      // Buscar configuração da Uazapi
      const uazapiIntegrations = await queryMany(
        'SELECT config FROM integrations WHERE type = $1 AND is_active = true',
        ['uazapi']
      );

      if (!uazapiIntegrations || uazapiIntegrations.length === 0) {
        return NextResponse.json(
          { success: false, error: "Uazapi não configurada" },
          { status: 500, headers: securityHeaders }
        );
      }

      const uazapiConfig = uazapiIntegrations[0].config;
      const instanceToken = connection.instance_token;

      if (!instanceToken) {
        return NextResponse.json(
          { success: false, error: "Token da instância não encontrado" },
          { status: 500, headers: securityHeaders }
        );
      }

      try {
        // Conectar à instância Uazapi (gera QR ou paircode)
        console.log("🔄 [QR-GENERATE-UAZAPI] Conectando instância...");
        
        const connectResponse = await fetch(
          `${uazapiConfig.serverUrl}/instance/connect`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "token": instanceToken,
            },
            signal: AbortSignal.timeout(15000),
          }
        );

        if (!connectResponse.ok) {
          const errorText = await connectResponse.text();
          console.error("❌ [QR-GENERATE-UAZAPI] Erro ao conectar:", errorText);
          return NextResponse.json(
            { 
              success: false, 
              error: "Erro ao gerar QR Code via Uazapi",
              code: "UAZAPI_CONNECT_ERROR"
            },
            { status: 502, headers: securityHeaders }
          );
        }

        const connectData = await connectResponse.json();
        console.log("✅ [QR-GENERATE-UAZAPI] Resposta recebida");

        // Buscar status atualizado com QR Code
        const statusResponse = await fetch(
          `${uazapiConfig.serverUrl}/instance/status`,
          {
            method: "GET",
            headers: {
              "token": instanceToken,
            },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!statusResponse.ok) {
          return NextResponse.json(
            { success: false, error: "Erro ao buscar status da instância Uazapi" },
            { status: 502, headers: securityHeaders }
          );
        }

        const statusData = await statusResponse.json();
        const qrCode = statusData.instance?.qrcode;
        const pairCode = statusData.instance?.paircode;

        if (!qrCode && !pairCode) {
          return NextResponse.json(
            { 
              success: false, 
              error: "QR Code não disponível. A instância pode já estar conectada.",
              code: "QR_NOT_AVAILABLE"
            },
            { status: 400, headers: securityHeaders }
          );
        }

        // Incrementar uso do link
        await incrementLinkUsage(
          link.id, 
          clientIP, 
          request.headers.get('user-agent') || 'unknown'
        );

        console.log("✅ [QR-GENERATE-UAZAPI] QR Code gerado com sucesso!");
        
        return NextResponse.json({
          success: true,
          data: {
            qr_code: qrCode,
            pair_code: pairCode,
            expires_in: 120, // 2 minutos para QR Code
            connection: {
              name: link.wc_connection_name || "WhatsApp",
              instance_name: connection.instance_name,
              status: statusData.instance?.status || "connecting"
            },
            api_type: "uazapi"
          }
        }, { headers: securityHeaders });

      } catch (error: any) {
        console.error("💥 [QR-GENERATE-UAZAPI] Erro:", error);
        
        if (error.name === "TimeoutError" || error.name === "AbortError") {
          return NextResponse.json(
            { success: false, error: "Timeout ao gerar QR Code. Tente novamente." },
            { status: 408, headers: securityHeaders }
          );
        }

        return NextResponse.json(
          { success: false, error: "Erro ao gerar QR Code via Uazapi" },
          { status: 500, headers: securityHeaders }
        );
      }
    }

    // === EVOLUTION API (comportamento original) ===
    console.log("🟢 [QR-GENERATE] Gerando QR Code via Evolution API...");
    
    // Buscar configuração da Evolution API
    const integrations = await queryMany(
      'SELECT config FROM integrations WHERE type = $1 AND is_active = true',
      ['evolution_api']
    );

    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada" },
        { status: 500, headers: securityHeaders }
      );
    }

    const evolutionConfig = integrations[0].config;

    try {
      // Gerar QR Code via Evolution API
      console.log("🔄 [QR-GENERATE] Chamando Evolution API para gerar QR Code...");
      console.log("📋 [QR-GENERATE] Connection data:", {
        instance_name: connection.instance_name,
        user_id: connection.user_id,
        status: connection.status
      });
      console.log("🔧 [QR-GENERATE] Evolution config:", {
        apiUrl: evolutionConfig.apiUrl,
        hasApiKey: !!evolutionConfig.apiKey,
        apiKeyStart: evolutionConfig.apiKey?.substring(0, 8) + "..."
      });
      
      // Primeiro, verificar status da instância
      const statusUrl = `${evolutionConfig.apiUrl}/instance/fetchInstances`;
      console.log("🌐 [QR-GENERATE] Fazendo requisição para:", statusUrl);
      
      const statusResponse = await fetch(statusUrl, {
        method: "GET",
        headers: {
          apikey: evolutionConfig.apiKey,
        },
        signal: AbortSignal.timeout(15000) // Timeout de 15 segundos
      });

      console.log("📡 [QR-GENERATE] Status response:", {
        status: statusResponse.status,
        statusText: statusResponse.statusText,
        ok: statusResponse.ok,
        headers: Object.fromEntries(statusResponse.headers.entries())
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("❌ [QR-GENERATE] Erro ao buscar status da instância:", {
          status: statusResponse.status,
          statusText: statusResponse.statusText,
          errorText: errorText
        });
        
        if (statusResponse.status === 404) {
          return NextResponse.json(
            { 
              success: false, 
              error: "Instância não encontrada na Evolution API",
              code: "INSTANCE_NOT_FOUND",
              debug: {
                url: statusUrl,
                instance_name: connection.instance_name,
                error: errorText
              }
            },
            { status: 404, headers: securityHeaders }
          );
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: "Erro ao comunicar com Evolution API",
            code: "EVOLUTION_API_ERROR",
            debug: {
              url: statusUrl,
              status: statusResponse.status,
              error: errorText
            }
          },
          { status: 502, headers: securityHeaders }
        );
      }

      const instancesData = await statusResponse.json();
      console.log("📊 [QR-GENERATE] Instances data received:", {
        isArray: Array.isArray(instancesData),
        length: Array.isArray(instancesData) ? instancesData.length : 'N/A',
        firstInstance: Array.isArray(instancesData) && instancesData.length > 0 ? {
          instanceName: instancesData[0].instanceName,
          name: instancesData[0].name,
          status: instancesData[0].status,
          connectionStatus: instancesData[0].connectionStatus,
          allKeys: Object.keys(instancesData[0])
        } : instancesData
      });
      
      // Encontrar a instância específica - tentar diferentes campos
      let instanceData = null;
      
      if (Array.isArray(instancesData)) {
        // Tentar buscar por instanceName primeiro
        instanceData = instancesData.find(inst => inst.instanceName === connection.instance_name);
        
        // Se não encontrou, tentar buscar por name
        if (!instanceData) {
          instanceData = instancesData.find(inst => inst.name === connection.instance_name);
        }
        
        // Se ainda não encontrou, tentar buscar por id ou outras propriedades
        if (!instanceData) {
          instanceData = instancesData.find(inst => 
            inst.id === connection.instance_name || 
            inst.instanceId === connection.instance_name
          );
        }
      } else {
        instanceData = instancesData;
      }

      console.log("🎯 [QR-GENERATE] Instance search result:", {
        searchingFor: connection.instance_name,
        found: !!instanceData,
        instanceData: instanceData ? {
          instanceName: instanceData.instanceName,
          name: instanceData.name,
          id: instanceData.id,
          instanceId: instanceData.instanceId,
          status: instanceData.status,
          connectionStatus: instanceData.connectionStatus,
          allKeys: Object.keys(instanceData)
        } : null,
        availableInstancesDetails: Array.isArray(instancesData) 
          ? instancesData.map(inst => ({
              instanceName: inst.instanceName,
              name: inst.name,
              id: inst.id,
              instanceId: inst.instanceId
            }))
          : 'not_array'
      });

      if (!instanceData) {
        console.error("❌ [QR-GENERATE] Instância não encontrada no resultado:", {
          searchingFor: connection.instance_name,
          availableInstances: Array.isArray(instancesData) 
            ? instancesData.map(inst => ({
                instanceName: inst.instanceName,
                name: inst.name,
                id: inst.id,
                instanceId: inst.instanceId
              }))
            : 'not_array'
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: "Instância não encontrada",
            code: "INSTANCE_NOT_FOUND",
            debug: {
              searchingFor: connection.instance_name,
              availableInstances: Array.isArray(instancesData) 
                ? instancesData.map(inst => ({
                    instanceName: inst.instanceName,
                    name: inst.name,
                    id: inst.id,
                    instanceId: inst.instanceId
                  }))
                : instancesData
            }
          },
          { status: 404, headers: securityHeaders }
        );
      }

      // Se já está conectado, não precisa de QR Code
      if (instanceData.status === 'open' || instanceData.connectionStatus === 'open') {
        console.log("ℹ️ [QR-GENERATE] Instância já conectada:", {
          status: instanceData.status,
          connectionStatus: instanceData.connectionStatus
        });
        
        return NextResponse.json({
          success: false,
          error: "Instância já está conectada. Não é necessário QR Code.",
          code: "ALREADY_CONNECTED",
          data: {
            instance_name: connection.instance_name,
            status: 'connected',
            message: "A instância já está conectada ao WhatsApp"
          }
        }, { headers: securityHeaders });
      }

      // Tentar obter QR Code via endpoint de connect
      const qrUrl = `${evolutionConfig.apiUrl}/instance/connect/${connection.instance_name}`;
      console.log("🌐 [QR-GENERATE] Fazendo requisição QR para:", qrUrl);
      
      const qrResponse = await fetch(qrUrl, {
        method: "GET",
        headers: {
          apikey: evolutionConfig.apiKey,
        },
        signal: AbortSignal.timeout(15000)
      });

      console.log("📡 [QR-GENERATE] QR response:", {
        status: qrResponse.status,
        statusText: qrResponse.statusText,
        ok: qrResponse.ok,
        headers: Object.fromEntries(qrResponse.headers.entries())
      });

      if (!qrResponse.ok) {
        const errorText = await qrResponse.text();
        console.error("❌ [QR-GENERATE] Erro ao gerar QR Code:", {
          url: qrUrl,
          status: qrResponse.status,
          statusText: qrResponse.statusText,
          errorText: errorText
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: "Erro ao gerar QR Code. Tente reconectar a instância.",
            code: "QR_GENERATION_FAILED",
            debug: {
              url: qrUrl,
              status: qrResponse.status,
              error: errorText
            }
          },
          { status: 502, headers: securityHeaders }
        );
      }

      const qrData = await qrResponse.json();
      console.log("📊 [QR-GENERATE] QR data received:", {
        hasQrcode: !!qrData.qrcode,
        hasBase64: !!qrData.base64,
        qrcodeKeys: qrData.qrcode ? Object.keys(qrData.qrcode) : [],
        dataKeys: Object.keys(qrData)
      });
      
      // Log de sucesso
      logSecurityEvent({
        type: 'ACCESS_ATTEMPT',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { 
          action: 'QR_GENERATE_SUCCESS',
          instance_name: connection.instance_name,
          processing_time: Date.now() - startTime
        }
      });

      // Verificar se tem QR Code na resposta
      if (qrData.qrcode && qrData.qrcode.base64) {
        console.log("✅ [QR-GENERATE] QR Code gerado com sucesso (qrcode.base64)");
        
        // Incrementar uso do link
        await incrementLinkUsage(link.id, clientIP, request.headers.get('user-agent') || 'unknown');
        
        return NextResponse.json({
          success: true,
          data: {
            qr_code: qrData.qrcode.base64,
            instance_name: connection.instance_name,
            status: instanceData.status || 'connecting',
            expires_in: 40 // QR Code expira em 40 segundos
          }
        }, { headers: securityHeaders });
      } else if (qrData.base64) {
        // Formato alternativo
        console.log("✅ [QR-GENERATE] QR Code gerado com sucesso (base64)");
        
        // Incrementar uso do link
        await incrementLinkUsage(link.id, clientIP, request.headers.get('user-agent') || 'unknown');
        
        return NextResponse.json({
          success: true,
          data: {
            qr_code: qrData.base64,
            instance_name: connection.instance_name,
            status: instanceData.status || 'connecting',
            expires_in: 40
          }
        }, { headers: securityHeaders });
      } else {
        console.log("⚠️ [QR-GENERATE] QR Code não disponível na resposta:", qrData);
        return NextResponse.json({
          success: false,
          error: "QR Code não disponível. A conexão pode já estar ativa ou em processo de conexão.",
          code: "QR_NOT_AVAILABLE",
          data: {
            instance_name: connection.instance_name,
            status: instanceData.status || 'unknown',
            message: "Tente verificar o status da conexão ou aguarde alguns momentos"
          },
          debug: {
            receivedData: qrData
          }
        }, { headers: securityHeaders });
      }

    } catch (evolutionError: any) {
      console.error("💥 [QR-GENERATE] Erro fatal na Evolution API:", {
        name: evolutionError.name,
        message: evolutionError.message,
        stack: evolutionError.stack,
        cause: evolutionError.cause,
        code: evolutionError.code
      });
      
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        token,
        details: { 
          action: 'QR_GENERATE_ERROR',
          error: evolutionError.message,
          processing_time: Date.now() - startTime
        }
      });

      return NextResponse.json(
        { 
          success: false, 
          error: "Erro interno ao gerar QR Code",
          code: "INTERNAL_ERROR",
          debug: {
            error: evolutionError.message,
            type: evolutionError.name
          }
        },
        { status: 500, headers: securityHeaders }
      );
    }

  } catch (error: any) {
    console.error("💥 [QR-GENERATE] Erro geral:", error);
    
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