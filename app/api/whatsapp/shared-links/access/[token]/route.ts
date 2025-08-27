import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Função para criar cliente Supabase com verificação segura
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: "impaai" },
  });
}

// Função para verificar senha
function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const testHash = crypto.pbkdf2Sync(password, salt, 310000, 128, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch (error) {
    console.error("❌ [VERIFY-PASSWORD] Erro na verificação:", error);
    return false;
  }
}

// Função para registrar acesso
async function logAccess(linkId: string, ip: string, userAgent: string) {
  try {
    // Tentar usar SUPABASE_SERVICE_ROLE_KEY, se não existir usar SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    
    if (!serviceKey || !supabaseUrl) return;

    const serviceSupabase = createClient(supabaseUrl, serviceKey, {
      db: { schema: "impaai" },
    });

    const accessLog = {
      timestamp: new Date().toISOString(),
      ip,
      user_agent: userAgent
    };

    // Buscar dados atuais primeiro
    const { data: currentLink } = await serviceSupabase
      .from("shared_whatsapp_links")
      .select("current_uses, access_logs")
      .eq("id", linkId)
      .single();

    if (currentLink) {
      const newUses = (currentLink.current_uses || 0) + 1;
      const currentLogs = Array.isArray(currentLink.access_logs) ? currentLink.access_logs : [];
      const newLogs = [...currentLogs, accessLog];

      // Atualizar logs de acesso e contador
      await serviceSupabase
        .from("shared_whatsapp_links")
        .update({
          current_uses: newUses,
          last_accessed_at: new Date().toISOString(),
          last_accessed_ip: ip,
          access_logs: newLogs
        })
        .eq("id", linkId);
    }

  } catch (error) {
    console.error("⚠️ [SHARED-ACCESS] Erro ao registrar acesso:", error);
  }
}

// Função para verificar status real na Evolution API
async function getRealConnectionStatus(instanceName: string) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("⚠️ [STATUS-CHECK] Configuração do Supabase não disponível");
      return null;
    }

    // Buscar configuração da Evolution API
    const integrationResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      }
    );

    if (!integrationResponse.ok) {
      console.warn("⚠️ [STATUS-CHECK] Erro ao buscar config da Evolution API");
      return null;
    }

    const integrations = await integrationResponse.json();
    if (!integrations || integrations.length === 0) {
      console.warn("⚠️ [STATUS-CHECK] Evolution API não configurada");
      return null;
    }

    const config = integrations[0].config;
    if (!config?.apiUrl || !config?.apiKey) {
      console.warn("⚠️ [STATUS-CHECK] Configuração da Evolution API incompleta");
      return null;
    }

    // Verificar status real na Evolution API
    console.log(`🔍 [STATUS-CHECK] Verificando status real de: ${instanceName}`);
    const statusResponse = await fetch(
      `${config.apiUrl}/instance/connectionState/${instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: config.apiKey,
        },
        signal: AbortSignal.timeout(8000), // 8 segundos timeout
      }
    );

    if (!statusResponse.ok) {
      console.warn(`⚠️ [STATUS-CHECK] Erro ${statusResponse.status} ao verificar status`);
      return null;
    }

    const statusData = await statusResponse.json();
    
    let realStatus = "disconnected";
    if (statusData?.instance?.state) {
      switch (statusData.instance.state) {
        case "open":
          realStatus = "connected";
          break;
        case "connecting":
          realStatus = "connecting";
          break;
        case "close":
        default:
          realStatus = "disconnected";
          break;
      }
    }

    console.log(`✅ [STATUS-CHECK] Status real: ${realStatus} (Evolution: ${statusData?.instance?.state})`);

    // Atualizar status no banco se for diferente
    try {
      await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Accept-Profile": "impaai",
            "Content-Profile": "impaai",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            status: realStatus,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      console.log(`🔄 [STATUS-CHECK] Status atualizado no banco: ${realStatus}`);
    } catch (updateError) {
      console.warn("⚠️ [STATUS-CHECK] Erro ao atualizar status no banco:", updateError);
    }

    return {
      status: realStatus,
      phoneNumber: statusData?.instance?.wuid || statusData?.instance?.number || null,
      profileName: statusData?.instance?.profileName || null,
      profilePicUrl: statusData?.instance?.profilePicUrl || null,
    };

  } catch (error) {
    console.warn("⚠️ [STATUS-CHECK] Erro ao verificar status real:", error);
    return null;
  }
}

// GET - Obter informações do link (sem senha)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log("🔍 [SHARED-ACCESS] Acessando link:", token.substring(0, 10) + "...");

    const supabase = createSupabaseClient();

    // Buscar link compartilhado com informações da conexão
    const { data: link, error } = await supabase
      .from("shared_whatsapp_links")
      .select(`
        id,
        connection_id,
        password_hash,
        permissions,
        expires_at,
        max_uses,
        current_uses,
        whatsapp_connections (
          id,
          connection_name,
          instance_name,
          status,
          phone_number
        )
      `)
      .eq("token", token)
      .eq("is_active", true)
      .single();

    if (error || !link) {
      console.error("❌ [SHARED-ACCESS] Link não encontrado:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Link não encontrado ou expirado",
          code: "LINK_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Verificar se o link não expirou
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      console.log("⏰ [SHARED-ACCESS] Link expirado:", token);
      return NextResponse.json(
        { 
          success: false, 
          error: "Link expirado",
          code: "LINK_EXPIRED"
        },
        { status: 410 }
      );
    }

    // Verificar limite de usos
    if (link.max_uses && link.current_uses >= link.max_uses) {
      console.log("🚫 [SHARED-ACCESS] Limite de usos atingido:", token);
      return NextResponse.json(
        { 
          success: false, 
          error: "Limite de usos atingido",
          code: "USAGE_LIMIT_REACHED"
        },
        { status: 410 }
      );
    }

    // Verificar se whatsapp_connections existe e tem dados
    const connection = link.whatsapp_connections as any;
    if (!connection) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Conexão não encontrada",
          code: "CONNECTION_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Verificar status real na Evolution API
    const realStatus = await getRealConnectionStatus(connection.instance_name);
    
    // Retornar informações públicas do link
    const linkInfo = {
      connection: {
        name: connection.connection_name,
        instance_name: connection.instance_name,
        status: realStatus?.status || connection.status,
        phone_number: realStatus?.phoneNumber || connection.phone_number,
        profile_name: realStatus?.profileName || null,
        profile_pic_url: realStatus?.profilePicUrl || null
      },
      permissions: link.permissions,
      requires_password: !!link.password_hash,
      expires_at: link.expires_at,
      usage: {
        current: link.current_uses,
        max: link.max_uses
      }
    };

    console.log("✅ [SHARED-ACCESS] Informações do link retornadas");

    return NextResponse.json({
      success: true,
      data: linkInfo
    });

  } catch (error: any) {
    console.error("💥 [SHARED-ACCESS] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Acessar link com senha (se necessário)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { password } = body;

    console.log("🔐 [SHARED-ACCESS] Tentativa de acesso com senha:", token.substring(0, 10) + "...");

    // Obter IP e User-Agent para logging
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const supabase = createSupabaseClient();

    // Buscar link completo
    const { data: link, error } = await supabase
      .from("shared_whatsapp_links")
      .select(`
        id,
        connection_id,
        password_hash,
        salt,
        permissions,
        expires_at,
        max_uses,
        current_uses,
        whatsapp_connections (
          id,
          connection_name,
          instance_name,
          status,
          phone_number,
          qr_code,
          settings
        )
      `)
      .eq("token", token)
      .eq("is_active", true)
      .single();

    if (error || !link) {
      console.error("❌ [SHARED-ACCESS] Link não encontrado:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Link não encontrado ou expirado",
          code: "LINK_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Verificar expiração
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Link expirado",
          code: "LINK_EXPIRED"
        },
        { status: 410 }
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
        { status: 410 }
      );
    }

    // Verificar senha se necessário
    if (link.password_hash) {
      if (!password) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Senha é obrigatória",
            code: "PASSWORD_REQUIRED"
          },
          { status: 401 }
        );
      }

      if (!link.salt || !verifyPassword(password, link.password_hash, link.salt)) {
        console.log("🚫 [SHARED-ACCESS] Senha incorreta para:", token);
        return NextResponse.json(
          { 
            success: false, 
            error: "Senha incorreta",
            code: "INVALID_PASSWORD"
          },
          { status: 401 }
        );
      }
    }

    // Registrar acesso
    await logAccess(link.id, ip, userAgent);

    // Verificar se whatsapp_connections existe
    const connection = link.whatsapp_connections as any;
    if (!connection) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Conexão não encontrada",
          code: "CONNECTION_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Verificar status real na Evolution API
    const realStatus = await getRealConnectionStatus(connection.instance_name);

    // Montar resposta baseada nas permissões
    const responseData: any = {
      connection: {
        name: connection.connection_name,
        instance_name: connection.instance_name,
        status: realStatus?.status || connection.status,
        phone_number: realStatus?.phoneNumber || connection.phone_number,
        profile_name: realStatus?.profileName || null,
        profile_pic_url: realStatus?.profilePicUrl || null
      },
      permissions: link.permissions
    };

    // Adicionar QR Code se permitido
    if (link.permissions.qr_code) {
      // Se já tem QR Code no banco, usar ele
      if (connection.qr_code) {
        responseData.qr_code = connection.qr_code;
      } else {
        // Tentar buscar QR Code da Evolution API
        try {
          // Buscar configuração da Evolution API
          const integrationResponse = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
            {
              headers: {
                "Content-Type": "application/json",
                "Accept-Profile": "impaai",
                "Content-Profile": "impaai",
                apikey: process.env.SUPABASE_ANON_KEY!,
                Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY!}`,
              },
            }
          );

          if (integrationResponse.ok) {
            const integrations = await integrationResponse.json();
            if (integrations && integrations.length > 0) {
              const evolutionConfig = integrations[0].config;
              
              // Primeiro verificar status da instância
              const statusResponse = await fetch(
                `${evolutionConfig.apiUrl}/instance/fetchInstances`,
                {
                  method: "GET",
                  headers: {
                    apikey: evolutionConfig.apiKey,
                  },
                }
              );

              if (statusResponse.ok) {
                const instancesData = await statusResponse.json();
                const instanceData = Array.isArray(instancesData) 
                  ? instancesData.find(inst => inst.instanceName === connection.instance_name || inst.name === connection.instance_name)
                  : instancesData;

                if (instanceData) {
                  // Atualizar dados da conexão com informações da Evolution API
                  responseData.connection = {
                    ...responseData.connection,
                    status: instanceData.status === 'open' ? 'connected' : instanceData.connectionStatus || instanceData.status || 'disconnected',
                    profile_name: instanceData.profileName,
                    profile_pic_url: instanceData.profilePicUrl,
                    phone_number: instanceData.number
                  };

                  // Se a instância está conectada, não mostrar QR Code
                  if (instanceData.status === 'open' || instanceData.connectionStatus === 'open') {
                    responseData.qr_message = "Instância já conectada ao WhatsApp.";
                    console.log("✅ [SHARED-ACCESS] Instância já conectada");
                  } else {
                    // Tentar buscar QR Code se não estiver conectado
                    const qrResponse = await fetch(
                      `${evolutionConfig.apiUrl}/instance/connect/${connection.instance_name}`,
                      {
                        method: "GET",
                        headers: {
                          apikey: evolutionConfig.apiKey,
                        },
                      }
                    );

                    if (qrResponse.ok) {
                      const qrData = await qrResponse.json();
                      if (qrData.qrcode && qrData.qrcode.base64) {
                        responseData.qr_code = qrData.qrcode.base64;
                        console.log("✅ [SHARED-ACCESS] QR Code obtido da Evolution API");
                      } else if (qrData.base64) {
                        responseData.qr_code = qrData.base64;
                        console.log("✅ [SHARED-ACCESS] QR Code obtido da Evolution API (formato alternativo)");
                      } else {
                        responseData.qr_message = "QR Code não disponível. Use o botão 'Gerar QR Code'.";
                      }
                    } else {
                      responseData.qr_message = "QR Code não disponível. Use o botão 'Gerar QR Code'.";
                    }
                  }
                } else {
                  responseData.qr_message = "Instância não encontrada na Evolution API.";
                }
              } else {
                responseData.qr_message = "Erro ao verificar status da instância.";
              }
            }
          }
        } catch (qrError) {
          console.error("⚠️ [SHARED-ACCESS] Erro ao buscar QR Code:", qrError);
          responseData.qr_message = "QR Code não disponível. Use o botão 'Gerar QR Code'.";
        }
      }
    }

    // Adicionar estatísticas se permitido
    if (link.permissions.stats) {
      // Aqui você pode buscar estatísticas reais da Evolution API
      responseData.stats = {
        contacts: 0,
        chats: 0,
        messages: 0
      };
    }

    // Adicionar configurações se permitido
    if (link.permissions.settings) {
      responseData.settings = connection.settings || {};
    }

    console.log("✅ [SHARED-ACCESS] Acesso autorizado:", token);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: "Acesso autorizado"
    });

  } catch (error: any) {
    console.error("💥 [SHARED-ACCESS] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 