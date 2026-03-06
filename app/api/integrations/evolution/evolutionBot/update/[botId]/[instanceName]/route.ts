import { NextResponse } from "next/server";
import { queryMany } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ botId: string; instanceName: string }> }) {
  console.log("📡 API: PUT /api/integrations/evolution/evolutionBot/update chamada");

  try {
    const { botId, instanceName } = await params;
    const botData = await request.json();

    console.log("🤖 Atualizando bot na Evolution API:", botId, "instância:", instanceName);

    // Buscar configurações da Evolution API na tabela integrations via SQL
    console.log("🔍 Buscando configurações da Evolution API...");

    const integrations = await queryMany<any>(
      `SELECT * FROM integrations WHERE type = 'evolution_api' AND is_active = true`
    );

    if (!integrations || integrations.length === 0) {
      throw new Error("Evolution API não configurada");
    }

    const evolutionIntegration = integrations[0];
    const evolutionConfig =
      typeof evolutionIntegration.config === "string"
        ? JSON.parse(evolutionIntegration.config)
        : evolutionIntegration.config;

    const evolutionUrl = evolutionConfig.apiUrl;
    const evolutionKey = evolutionConfig.apiKey;

    if (!evolutionUrl || !evolutionKey) {
      throw new Error("Configurações da Evolution API incompletas");
    }

    // Fazer requisição para a Evolution API
    const evolutionApiUrl = `${evolutionUrl}/evolutionBot/update/${botId}/${instanceName}`;
    console.log("🌐 Fazendo requisição para Evolution API...");

    const evolutionResponse = await fetch(evolutionApiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionKey,
      },
      body: JSON.stringify(botData),
    });

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
      console.error("❌ Erro na Evolution API:", evolutionResponse.status, errorText);
      throw new Error(`Erro na Evolution API: ${evolutionResponse.status} - ${errorText}`);
    }

    const result = await evolutionResponse.json();
    console.log("✅ Bot atualizado na Evolution API:", result.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Erro ao atualizar bot na Evolution API:", error.message);
    return NextResponse.json(
      {
        error: "Erro ao atualizar bot na Evolution API",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
