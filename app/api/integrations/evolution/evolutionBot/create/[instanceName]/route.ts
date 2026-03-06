import { NextResponse } from "next/server";
import { queryMany } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  console.log(
    "📡 API: POST /api/integrations/evolution/evolutionBot/create chamada"
  );

  try {
    const { instanceName } = await params;
    const botData = await request.json();

    console.log(
      "🤖 Criando bot na Evolution API para instância:",
      instanceName
    );

    // Buscar configurações da Evolution API na tabela integrations via SQL
    console.log(
      "🔍 Buscando configurações da Evolution API na tabela integrations..."
    );

    const integrations = await queryMany<any>(
      `SELECT * FROM integrations WHERE type = 'evolution_api' AND is_active = true`
    );

    console.log("📋 Integrações encontradas:", integrations.length);

    if (!integrations || integrations.length === 0) {
      throw new Error(
        "Evolution API não configurada. Adicione a integração Evolution API no sistema."
      );
    }

    const evolutionIntegration = integrations[0];
    console.log(
      "✅ Integração Evolution API encontrada:",
      evolutionIntegration.name
    );

    // Extrair configurações do JSON
    let evolutionConfig;
    try {
      evolutionConfig =
        typeof evolutionIntegration.config === "string"
          ? JSON.parse(evolutionIntegration.config)
          : evolutionIntegration.config;
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse da configuração:", parseError);
      throw new Error("Configuração da Evolution API está malformada");
    }

    const evolutionUrl = evolutionConfig.apiUrl;
    const evolutionKey = evolutionConfig.apiKey;

    if (!evolutionUrl || !evolutionKey) {
      console.error("❌ Configurações incompletas:", {
        hasUrl: !!evolutionUrl,
        hasKey: !!evolutionKey,
        config: evolutionConfig,
      });
      throw new Error(
        "Configurações da Evolution API incompletas. Verifique apiUrl e apiKey."
      );
    }

    console.log("✅ Configurações da Evolution API validadas");

    // Fazer requisição para a Evolution API
    const evolutionApiUrl = `${evolutionUrl}/evolutionBot/create/${instanceName}`;
    console.log("🌐 Fazendo requisição para Evolution API...");

    const evolutionResponse = await fetch(evolutionApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionKey,
      },
      body: JSON.stringify(botData),
    });

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
      console.error(
        "❌ Erro na Evolution API:",
        evolutionResponse.status,
        errorText
      );
      throw new Error(
        `Erro na Evolution API: ${evolutionResponse.status} - ${errorText}`
      );
    }

    const result = await evolutionResponse.json();
    console.log("✅ Bot criado na Evolution API:", result.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Erro ao criar bot na Evolution API:", error.message);
    return NextResponse.json(
      {
        error: "Erro ao criar bot na Evolution API",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
