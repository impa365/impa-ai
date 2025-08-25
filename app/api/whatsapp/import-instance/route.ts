import { NextRequest, NextResponse } from "next/server";
import { getCurrentServerUser } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    console.log("📥 [IMPORT-INSTANCE] Iniciando importação de instância...");

    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { instanceName, apiKey } = body;

    console.log("📋 [IMPORT-INSTANCE] Dados recebidos:", {
      instanceName,
      hasApiKey: !!apiKey
    });

    // Validar dados obrigatórios
    if (!instanceName || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Nome da instância e API Key são obrigatórios" },
        { status: 400 }
      );
    }

    // Configurar Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Configuração do banco não encontrada" },
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

    // Buscar configuração da Evolution API existente
    console.log("🔍 [IMPORT-INSTANCE] Buscando configuração da Evolution API...");
    
    const integrationResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
      { headers }
    );

    if (!integrationResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Erro ao buscar configuração da Evolution API" },
        { status: 500 }
      );
    }

    const integrations = await integrationResponse.json();
    
    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Evolution API não está configurada no sistema. Configure primeiro em Integrações." },
        { status: 404 }
      );
    }

    const evolutionConfig = integrations[0].config as {
      apiUrl?: string;
      apiKey?: string;
    };

    if (!evolutionConfig?.apiUrl) {
      return NextResponse.json(
        { success: false, error: "URL da Evolution API não está configurada" },
        { status: 400 }
      );
    }

    const evolutionApiUrl = evolutionConfig.apiUrl;
    console.log(`🔗 [IMPORT-INSTANCE] Usando Evolution API configurada: ${evolutionApiUrl}`);

    // Buscar informações da instância na Evolution API
    console.log(`🔗 [IMPORT-INSTANCE] Buscando informações da instância: ${evolutionApiUrl}/instance/fetchInstances`);
    
    const fetchResponse = await fetch(
      `${evolutionApiUrl}/instance/fetchInstances`,
      {
        method: "GET",
        headers: {
          apikey: apiKey,
        },
        signal: AbortSignal.timeout(15000), // 15 segundos timeout
      }
    );

    console.log(`📡 [IMPORT-INSTANCE] Response status: ${fetchResponse.status}`);

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error(`❌ [IMPORT-INSTANCE] Erro da Evolution API: ${fetchResponse.status} - ${errorText}`);
      
      if (fetchResponse.status === 401) {
        return NextResponse.json(
          { success: false, error: "API Key inválida" },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: `Erro ao buscar instância: ${fetchResponse.status}` },
        { status: 502 }
      );
    }

    const instancesData = await fetchResponse.json();
    console.log(`📊 [IMPORT-INSTANCE] Dados recebidos:`, instancesData);

    // Procurar a instância específica no resultado
    let targetInstance = null;
    
    if (Array.isArray(instancesData)) {
      targetInstance = instancesData.find(instance => 
        instance.instanceName === instanceName || 
        instance.name === instanceName ||
        instance.id === instanceName
      );
    } else if (instancesData.instanceName === instanceName || instancesData.name === instanceName) {
      targetInstance = instancesData;
    }

    if (!targetInstance) {
      console.error(`❌ [IMPORT-INSTANCE] Instância não encontrada: ${instanceName}`);
      return NextResponse.json(
        { success: false, error: `Instância "${instanceName}" não encontrada na Evolution API` },
        { status: 404 }
      );
    }

    console.log(`✅ [IMPORT-INSTANCE] Instância encontrada:`, targetInstance);

    // Verificar se a instância já existe no banco
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`,
      { headers }
    );

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      if (existing && existing.length > 0) {
        return NextResponse.json(
          { success: false, error: "Esta instância já está cadastrada no sistema" },
          { status: 409 }
        );
      }
    }

    // Mapear status da Evolution API para o banco
    let mappedStatus = 'disconnected';
    const evolutionStatus = targetInstance.connectionStatus || targetInstance.status;
    
    if (evolutionStatus) {
      switch (evolutionStatus.toLowerCase()) {
        case 'open':
          mappedStatus = 'connected';
          break;
        case 'connecting':
        case 'pairing':
          mappedStatus = 'connecting';
          break;
        case 'close':
        case 'closed':
        case 'disconnected':
          mappedStatus = 'disconnected';
          break;
        default:
          mappedStatus = 'disconnected';
      }
    }

    console.log(`🔄 [IMPORT-INSTANCE] Mapeamento de status: "${evolutionStatus}" → "${mappedStatus}"`);

    // Extrair informações detalhadas da instância
    const instanceName_final = targetInstance.instanceName || targetInstance.name || instanceName;
    const profileName = targetInstance.profileName || targetInstance.clientName || instanceName_final;
    const phoneNumber = targetInstance.number || 
                       (targetInstance.ownerJid ? targetInstance.ownerJid.split('@')[0] : null);
    const instanceToken = targetInstance.token || apiKey; // Usar token da Evolution ou a API Key fornecida

    // Preparar dados para salvar no banco
    const connectionData = {
      user_id: user.id,
      instance_name: instanceName_final,
      connection_name: `${profileName}`,
      status: mappedStatus,
      phone_number: phoneNumber,
      instance_token: instanceToken,
      qr_code: null,
      webhook_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`💾 [IMPORT-INSTANCE] Salvando no banco:`, connectionData);

    // Salvar no banco de dados
    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections`,
      {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
        body: JSON.stringify(connectionData),
      }
    );

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error(`❌ [IMPORT-INSTANCE] Erro ao salvar no banco: ${insertResponse.status} - ${errorText}`);
      return NextResponse.json(
        { success: false, error: "Erro ao salvar instância no banco de dados" },
        { status: 500 }
      );
    }

    const savedConnection = await insertResponse.json();
    console.log(`✅ [IMPORT-INSTANCE] Instância salva com sucesso:`, savedConnection[0]);

    // A configuração da Evolution API já existe (foi verificada anteriormente)
    console.log(`✅ [IMPORT-INSTANCE] Usando configuração existente da Evolution API`);

    return NextResponse.json({
      success: true,
      message: "Instância importada com sucesso",
      data: savedConnection[0],
    });

  } catch (error: any) {
    console.error("💥 [IMPORT-INSTANCE] Erro fatal:", error);

    if (error.name === "TimeoutError") {
      return NextResponse.json(
        { success: false, error: "Timeout ao conectar com Evolution API" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 