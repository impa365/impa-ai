import { NextResponse } from "next/server";
import { queryMany, rpc } from "@/lib/db";

// Cache simples para evitar consultas desnecessárias
let configCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000; // 30 segundos (sincronizado com /api/system/settings)

export async function GET() {
  console.log("=== /api/config - Iniciando requisição ===");

  try {
    // Verificar cache primeiro
    const now = Date.now();
    if (configCache && (now - configCache.timestamp) < CACHE_TTL) {
      console.log("✅ Cache válido encontrado, retornando dados em cache");
      return NextResponse.json(configCache.data);
    }

    console.log("🔄 Buscando system_themes via SQL...");

    // Buscar apenas system_themes como fonte única de verdade
    // Priorizar: is_default=true AND is_active=true, depois apenas is_active=true
    const themes = await queryMany<any>(
      `SELECT * FROM system_themes WHERE is_active = true ORDER BY is_default DESC, created_at DESC`
    );

    console.log("✅ Temas encontrados:", themes.length);
    console.log("Primeiro tema:", themes[0] ? themes[0].name : "Nenhum");

    if (!themes || themes.length === 0) {
      console.error("❌ ERRO: Nenhum tema ativo encontrado no banco");
      return NextResponse.json({ error: "Nenhum tema ativo encontrado" }, { status: 404 });
    }

    // Pegar o primeiro tema (que será o default se existir, senão o mais recente ativo)
    const activeTheme = themes[0];
    console.log("🎨 Tema ativo selecionado:", activeTheme.name);

    const themeData = {
      systemName: activeTheme.display_name || activeTheme.name,
      description: activeTheme.description || "Sistema de gestão",
      logoIcon: activeTheme.logo_icon || "🤖",
      primaryColor: activeTheme.colors?.primary || "#3b82f6",
      secondaryColor: activeTheme.colors?.secondary || "#10b981",
      accentColor: activeTheme.colors?.accent || "#8b5cf6",
      textColor: activeTheme.colors?.text,
      backgroundColor: activeTheme.colors?.background,
      fontFamily: activeTheme.fonts?.primary,
      borderRadius: activeTheme.borders?.radius,
      customCss: activeTheme.custom_css,
    };

    console.log("🔄 Buscando configuração de cadastro público via RPC...");

    // Buscar configuração de cadastro público usando RPC
    let allowPublicRegistration = false; // Padrão seguro
    try {
      const result = await rpc<boolean>("is_public_registration_allowed");
      allowPublicRegistration = result === true;
      console.log("🔧 Allow public registration:", allowPublicRegistration);
    } catch (rpcError: any) {
      console.error("⚠️ AVISO: Erro ao buscar settings (continuando com padrão):");
      console.error("Mensagem:", rpcError.message);
    }

    const settings = {
      allowPublicRegistration: allowPublicRegistration,
    };

    const apiResponse = {
      theme: themeData,
      settings: settings,
    };

    // Atualizar cache
    configCache = {
      data: apiResponse,
      timestamp: now,
    };

    console.log("✅ /api/config - Sucesso! Retornando dados");
    return NextResponse.json(apiResponse);

  } catch (error: any) {
    console.error("💥 ERRO FATAL em /api/config:");
    console.error("Tipo:", error.constructor.name);
    console.error("Mensagem:", error.message);
    console.error("Stack:", error.stack);

    // Em caso de erro, retornar erro sem fallback hardcoded
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
