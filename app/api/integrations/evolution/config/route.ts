import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function GET() {
  try {
    const integration = await queryOne<{ config: { apiUrl?: string; apiKey?: string } }>(
      `SELECT config FROM integrations WHERE type = 'evolution_api' AND is_active = true LIMIT 1`
    );

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuração da Evolution API não encontrada ou inativa",
        },
        { status: 404 }
      );
    }

    const config = integration.config;

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Configuração da Evolution API está em formato inválido",
        },
        { status: 400 }
      );
    }

    if (!config.apiUrl || config.apiUrl.trim() === "") {
      return NextResponse.json(
        { success: false, error: "URL da Evolution API não está configurada" },
        { status: 400 }
      );
    }

    // Retornar apenas se a configuração existe e está válida
    // NÃO retornar as credenciais reais
    return NextResponse.json({
      success: true,
      configured: true,
      hasApiKey: !!(config.apiKey && config.apiKey.trim() !== ""),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
