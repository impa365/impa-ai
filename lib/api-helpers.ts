// import type { NextRequest } from "next/server" // No longer needed for API key auth

// AuthResult interface and authenticateApiKey function have been removed

export async function getDefaultModel(): Promise<string | null> {
  try {
    console.log("🔍 [getDefaultModel] Iniciando busca do modelo padrão...");

    // Verificar variáveis de ambiente primeiro
    const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    console.log("🔧 [getDefaultModel] Variáveis de ambiente:");
    console.log(
      "- SUPABASE_URL:",
      supabaseUrl ? "✅ Definida" : "❌ Não encontrada"
    );
    console.log(
      "- SUPABASE_ANON_KEY:",
      supabaseKey ? "✅ Definida" : "❌ Não encontrada"
    );

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "❌ [getDefaultModel] Variáveis do Supabase não configuradas"
      );
      return "gpt-4o-mini"; // Fallback padrão
    }

    // Importar e criar cliente
    const { createClient } = await import("@supabase/supabase-js");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
      auth: { persistSession: false }, // Não persistir sessão para operações server-side
    });

    console.log(
      "🔗 [getDefaultModel] Cliente Supabase criado, fazendo query..."
    );

    // Query com timeout
    const queryPromise = supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single();

    // Timeout de 5 segundos
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout na consulta ao banco")), 5000)
    );

    const { data, error } = (await Promise.race([
      queryPromise,
      timeoutPromise,
    ])) as any;

    if (error) {
      console.error("❌ [getDefaultModel] Erro na query:", error.message);
      console.error("❌ [getDefaultModel] Detalhes do erro:", error);
      return "gpt-4o-mini"; // Fallback padrão
    }

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
