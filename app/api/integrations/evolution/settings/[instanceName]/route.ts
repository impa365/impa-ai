import { type NextRequest, NextResponse } from "next/server";
import { queryMany } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
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

    // Buscar configuração da Evolution API via SQL
    console.log(`🔍 [EVOLUTION-GET] Buscando integração Evolution API no banco...`);

    const integrationData = await queryMany<any>(
      `SELECT * FROM integrations WHERE type = 'evolution_api'`
    );

    console.log(`📊 [EVOLUTION-GET] Resultado da busca de integração:`, {
      found: !!integrationData,
      count: integrationData?.length || 0,
    });

    // Filtrar manualmente registros ativos (string 'true' ou boolean true)
    const activeIntegrations = integrationData?.filter((integration: any) =>
      integration.is_active === true || integration.is_active === 'true'
    ) || [];

    console.log(`📊 [EVOLUTION-GET] Integrações ativas filtradas:`, {
      count: activeIntegrations.length,
    });

    if (!activeIntegrations || activeIntegrations.length === 0) {
      console.error("❌ [EVOLUTION-GET] Evolution API não encontrada no banco");

      // DEBUG ADICIONAL: Buscar TODAS as integrações para debug
      console.log(`🔍 [EVOLUTION-GET] Debug: Buscando TODAS as integrações...`);

      const allIntegrations = await queryMany<any>(
        `SELECT id, name, type, is_active FROM integrations`
      );

      console.log(`📊 [EVOLUTION-GET] TODAS as integrações encontradas:`, {
        count: allIntegrations?.length || 0,
        data: allIntegrations ? JSON.stringify(allIntegrations, null, 2) : 'NENHUM DADO'
      });

      // Tentar buscar sem filtro is_active
      const evolutionIntegrations = await queryMany<any>(
        `SELECT * FROM integrations WHERE type = 'evolution_api'`
      );

      console.log(`📊 [EVOLUTION-GET] Integrações Evolution (sem filtro is_active):`, {
        count: evolutionIntegrations?.length || 0,
        data: evolutionIntegrations ? JSON.stringify(evolutionIntegrations, null, 2) : 'NENHUM DADO'
      });

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

      // ENDPOINT: /settings/find/{instanceName}
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION-GET] Erro na Evolution API externa: ${response.status}`);
        console.error(`📄 [EVOLUTION-GET] Corpo da resposta de erro:`, errorText);
        throw new Error(`API retornou status ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      console.log(`📥 [EVOLUTION-GET] Resposta completa da Evolution API externa:`, JSON.stringify(data, null, 2));

      return NextResponse.json({
        success: true,
        settings: data,
        source: "evolution_api",
      });
    } catch (fetchError: any) {
      console.error(`❌ [EVOLUTION-GET] Erro ao conectar com Evolution API externa:`, fetchError.message);
      console.error(`🔍 [EVOLUTION-GET] Stack trace:`, fetchError.stack);

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

    // Buscar configuração da Evolution API via SQL
    console.log(`🔍 [EVOLUTION-POST] Buscando integração Evolution API no banco...`);

    const integrationData = await queryMany<any>(
      `SELECT * FROM integrations WHERE type = 'evolution_api'`
    );

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

      // ENDPOINT: /settings/set/{instanceName}
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [EVOLUTION-POST] Erro na Evolution API externa: ${response.status}`);
        console.error(`📄 [EVOLUTION-POST] Corpo da resposta de erro:`, errorText);
        throw new Error(`API retornou status ${response.status}: ${errorText}`);
      }

      const data = await response.json();

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
