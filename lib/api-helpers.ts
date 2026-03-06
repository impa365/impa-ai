// import type { NextRequest } from "next/server" // No longer needed for API key auth

// AuthResult interface and authenticateApiKey function have been removed

export async function getDefaultModel(): Promise<string | null> {
  try {
    console.log("🔍 [getDefaultModel] Iniciando busca do modelo padrão...");

    const { queryOne } = await import("./db");

    console.log("🔗 [getDefaultModel] Conectando ao PostgreSQL, fazendo query...");

    // Query com timeout de 5 segundos
    const { queryWithTimeout } = await import("./db");

    const result = await queryWithTimeout<{ setting_value: string }>(
      `SELECT setting_value FROM system_settings WHERE setting_key = $1`,
      ["default_model"],
      5000
    );

    const data = result.rows[0];

    if (!data || !data.setting_value) {
      console.warn(
        "⚠️ [getDefaultModel] default_model não encontrado no banco"
      );
      return "gpt-4o-mini"; // Fallback padrão
    }

    const defaultModel = data.setting_value.toString().trim();
    console.log("✅ [getDefaultModel] Modelo padrão encontrado:", defaultModel);

    return defaultModel;
  } catch (error: any) {
    console.error("❌ [getDefaultModel] Erro geral:", error.message);
    console.error("❌ [getDefaultModel] Stack trace:", error.stack);
    return "gpt-4o-mini"; // Fallback padrão
  }
}

// Helper para parsear JSON de forma segura
export function safeParseJson(
  jsonString: string | null | undefined,
  defaultValue: any = null
): any {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}
