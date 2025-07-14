import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    // 🔧 CORREÇÃO: Await params antes de usar suas propriedades
    const resolvedParams = await params;
    const { instanceName } = resolvedParams;

    console.log(`🔍 [EVOLUTION-GET] Processando configurações para instância: ${instanceName}`);

    if (!instanceName) {
      console.error("❌ [EVOLUTION-GET] Nome da instância é obrigatório");
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar configuração da Evolution API
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    console.log(`🔍 [EVOLUTION-GET] Configurações do Supabase:`, {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING'
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [EVOLUTION-GET] Configuração do banco não encontrada");
      return NextResponse.json(
        { success: false, error: "Configuração do banco não encontrada" },
        { status: 500 }
      );
    }

    console.log(`🔍 [EVOLUTION-GET] Buscando integração Evolution API no banco...`);

    // 🔧 CORREÇÃO: Tentar primeiro sem filtro is_active para encontrar o registro
    let integrationUrl = `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&select=*`;
    const integrationHeaders = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    console.log(`🔗 [EVOLUTION-GET] URL da query:`, integrationUrl);
    console.log(`📋 [EVOLUTION-GET] Headers da query:`, JSON.stringify(integrationHeaders, null, 2));

    const integrationResponse = await fetch(integrationUrl, {
      headers: integrationHeaders,
    });

    console.log(`📡 [EVOLUTION-GET] Status da resposta do banco: ${integrationResponse.status} ${integrationResponse.statusText}`);
    console.log(`📋 [EVOLUTION-GET] Headers da resposta:`, JSON.stringify(Object.fromEntries(integrationResponse.headers.entries()), null, 2));

    if (!integrationResponse.ok) {
      const errorText = await integrationResponse.text();
      console.error(`❌ [EVOLUTION-GET] Erro na query do banco:`, errorText);
      return NextResponse.json(
        { success: false, error: `Erro ao buscar configuração no banco: ${integrationResponse.status}` },
        { status: 500 }
      );
    }

    const integrationData = await integrationResponse.json();

    console.log(`📊 [EVOLUTION-GET] Resultado da busca de integração:`, {
      found: !!integrationData,
      count: integrationData?.length || 0,
      data: integrationData ? JSON.stringify(integrationData, null, 2) : 'NENHUM DADO',
      dataType: typeof integrationData,
      isArray: Array.isArray(integrationData)
    });

    // Filtrar manualmente registros ativos (string 'true' ou boolean true)
    const activeIntegrations = integrationData?.filter((integration: any) => 
      integration.is_active === true || integration.is_active === 'true'
    ) || [];

    console.log(`📊 [EVOLUTION-GET] Integrações ativas filtradas:`, {
      count: activeIntegrations.length,
      data: JSON.stringify(activeIntegrations, null, 2)
    });

    if (!activeIntegrations || activeIntegrations.length === 0) {
      console.error("❌ [EVOLUTION-GET] Evolution API não encontrada no banco");
      
      // 🔍 DEBUG ADICIONAL: Buscar TODAS as integrações para debug
      console.log(`🔍 [EVOLUTION-GET] Debug: Buscando TODAS as integrações...`);
      
      const debugUrl = `${supabaseUrl}/rest/v1/integrations?select=id,name,type,is_active`;
      const debugResponse = await fetch(debugUrl, {
        headers: integrationHeaders,
      });
      
      if (debugResponse.ok) {
        const allIntegrations = await debugResponse.json();
        console.log(`📊 [EVOLUTION-GET] TODAS as integrações encontradas:`, {
          count: allIntegrations?.length || 0,
          data: allIntegrations ? JSON.stringify(allIntegrations, null, 2) : 'NENHUM DADO'
        });
        
        // Tentar buscar sem filtro is_active
        const debugUrl2 = `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&select=*`;
        const debugResponse2 = await fetch(debugUrl2, {
          headers: integrationHeaders,
        });
        
        if (debugResponse2.ok) {
          const evolutionIntegrations = await debugResponse2.json();
          console.log(`📊 [EVOLUTION-GET] Integrações Evolution (sem filtro is_active):`, {
            count: evolutionIntegrations?.length || 0,
            data: evolutionIntegrations ? JSON.stringify(evolutionIntegrations, null, 2) : 'NENHUM DADO'
          });
        }
      }
      
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada" },
        { status: 404 }
      );
    }

    const config = activeIntegrations[0].config;
    
    console.log(`🔍 [EVOLUTION-GET] Configuração encontrada:`, {
      hasConfig: !!config,
      hasApiUrl: !!config?.apiUrl,
      hasApiKey: !!config?.apiKey,
      apiUrl: config?.apiUrl ? `${config.apiUrl.substring(0, 30)}...` : 'MISSING',
      apiKeyPreview: config?.apiKey ? `${config.apiKey.substring(0, 8)}...` : 'MISSING',
      configType: typeof config,
      configRaw: config
    });
    
    if (!config?.apiUrl || !config?.apiKey) {
      console.error("❌ [EVOLUTION-GET] Configuração da Evolution API incompleta");
      return NextResponse.json(
        { success: false, error: "Configuração da Evolution API incompleta" },
        { status: 404 }
      );
    }

    // Tentar buscar configurações da Evolution API com timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos

      // 🔧 ENDPOINT CORRIGIDO: /settings/find/{instanceName}
      const apiUrl = `${config.apiUrl}/settings/find/${instanceName}`;
      
      console.log(`🌐 [EVOLUTION-GET] Fazendo requisição para Evolution API externa...`);
      console.log(`🔗 [EVOLUTION-GET] URL: ${apiUrl}`);
      console.log(`🔑 [EVOLUTION-GET] API Key: ${config.apiKey.substring(0, 8)}...`);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          apikey: config.apiKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📡 [EVOLUTION-GET] Status da resposta: ${response.status} ${response.statusText}`);
      console.log(`📋 [EVOLUTION-GET] Headers da resposta:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION-GET] Erro na Evolution API externa: ${response.status}`);
        console.error(`📄 [EVOLUTION-GET] Corpo da resposta de erro:`, errorText);
        throw new Error(`API retornou status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // 🔍 LOG DETALHADO DA RESPOSTA DA EVOLUTION API EXTERNA (APENAS SERVIDOR)
      console.log(`📥 [EVOLUTION-GET] Resposta completa da Evolution API externa:`, JSON.stringify(data, null, 2));

      return NextResponse.json({
        success: true,
        settings: data,
        source: "evolution_api",
      });
    } catch (fetchError: any) {
      console.error(`❌ [EVOLUTION-GET] Erro ao conectar com Evolution API externa:`, fetchError.message);
      console.error(`🔍 [EVOLUTION-GET] Stack trace:`, fetchError.stack);
      
      // 🚫 REMOVIDO: Configurações padrão - SEMPRE retornar erro se Evolution API falhar
      return NextResponse.json(
        { 
          success: false, 
          error: `Erro ao conectar com Evolution API: ${fetchError.message}`,
          details: "Verifique se a Evolution API está online e funcionando corretamente"
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    // 🔧 CORREÇÃO: Await params antes de usar suas propriedades
    const resolvedParams = await params;
    const { instanceName } = resolvedParams;
    const settings = await request.json();

    console.log(`🔍 [EVOLUTION-POST] Processando configurações para instância: ${instanceName}`);

    if (!instanceName) {
      console.error("❌ [EVOLUTION-POST] Nome da instância é obrigatório");
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar configuração da Evolution API
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    console.log(`🔍 [EVOLUTION-POST] Configurações do Supabase:`, {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [EVOLUTION-POST] Configuração do banco não encontrada");
      return NextResponse.json(
        { success: false, error: "Configuração do banco não encontrada" },
        { status: 500 }
      );
    }

    console.log(`🔍 [EVOLUTION-POST] Buscando integração Evolution API no banco...`);

    // 🔧 CORREÇÃO: Tentar primeiro sem filtro is_active para encontrar o registro
    const integrationUrl = `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&select=*`;
    const integrationHeaders = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    const integrationResponse = await fetch(integrationUrl, {
      headers: integrationHeaders,
    });

    if (!integrationResponse.ok) {
      console.error(`❌ [EVOLUTION-POST] Erro na query do banco: ${integrationResponse.status}`);
      return NextResponse.json(
        { success: false, error: `Erro ao buscar configuração no banco: ${integrationResponse.status}` },
        { status: 500 }
      );
    }

    const integrationData = await integrationResponse.json();

    console.log(`📊 [EVOLUTION-POST] Resultado da busca de integração:`, {
      found: !!integrationData,
      count: integrationData?.length || 0
    });

    // Filtrar manualmente registros ativos (string 'true' ou boolean true)
    const activeIntegrations = integrationData?.filter((integration: any) => 
      integration.is_active === true || integration.is_active === 'true'
    ) || [];

    console.log(`📊 [EVOLUTION-POST] Integrações ativas filtradas:`, {
      count: activeIntegrations.length
    });

    if (!activeIntegrations || activeIntegrations.length === 0) {
      console.error("❌ [EVOLUTION-POST] Evolution API não encontrada no banco");
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada" },
        { status: 404 }
      );
    }

    const config = activeIntegrations[0].config;
    
    console.log(`🔍 [EVOLUTION-POST] Configuração encontrada:`, {
      hasConfig: !!config,
      hasApiUrl: !!config?.apiUrl,
      hasApiKey: !!config?.apiKey,
      configType: typeof config
    });
    
    if (!config?.apiUrl || !config?.apiKey) {
      console.error("❌ [EVOLUTION-POST] Configuração da Evolution API incompleta");
      return NextResponse.json(
        { success: false, error: "Configuração da Evolution API incompleta" },
        { status: 404 }
      );
    }

    // Tentar salvar na Evolution API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos para salvar

      // 🔧 ENDPOINT CORRIGIDO: /settings/set/{instanceName}
      const apiUrl = `${config.apiUrl}/settings/set/${instanceName}`;
      
      console.log(`🌐 [EVOLUTION-POST] Fazendo requisição para Evolution API externa...`);
      console.log(`🔗 [EVOLUTION-POST] URL: ${apiUrl}`);
      console.log(`🔑 [EVOLUTION-POST] API Key: ${config.apiKey.substring(0, 8)}...`);
      console.log(`📤 [EVOLUTION-POST] Payload enviado:`, JSON.stringify(settings, null, 2));
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          apikey: config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📡 [EVOLUTION-POST] Status da resposta: ${response.status} ${response.statusText}`);
      console.log(`📋 [EVOLUTION-POST] Headers da resposta:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION-POST] Erro na Evolution API externa: ${response.status}`);
        console.error(`📄 [EVOLUTION-POST] Corpo da resposta de erro:`, errorText);
        throw new Error(`API retornou status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // 🔍 LOG DETALHADO DA RESPOSTA DA EVOLUTION API EXTERNA (APENAS SERVIDOR)
      console.log(`📥 [EVOLUTION-POST] Resposta completa da Evolution API externa:`, JSON.stringify(data, null, 2));

      return NextResponse.json({
        success: true,
        message: "Configurações salvas com sucesso na Evolution API",
        source: "evolution_api",
      });
    } catch (fetchError: any) {
      console.error(`❌ [EVOLUTION-POST] Erro ao conectar com Evolution API externa:`, fetchError.message);
      console.error(`🔍 [EVOLUTION-POST] Stack trace:`, fetchError.stack);
      
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao salvar na Evolution API: ${fetchError.message}`,
          details: "Verifique se a Evolution API está funcionando corretamente",
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
