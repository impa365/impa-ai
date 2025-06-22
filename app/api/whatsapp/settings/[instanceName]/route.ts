import { type NextRequest, NextResponse } from "next/server";

// Função para buscar configuração da Evolution API de forma segura
async function getEvolutionConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configuração do banco não encontrada");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
    {
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar configuração da Evolution API");
  }

  const integrations = await response.json();

  if (!integrations || integrations.length === 0) {
    throw new Error("Configuração da Evolution API não encontrada ou inativa");
  }

  const config = integrations[0].config as { apiUrl?: string; apiKey?: string };

  if (!config || typeof config !== "object") {
    throw new Error("Configuração da Evolution API está em formato inválido");
  }

  if (!config.apiUrl || config.apiUrl.trim() === "") {
    throw new Error("URL da Evolution API não está configurada");
  }

  if (!config.apiKey || config.apiKey.trim() === "") {
    throw new Error("API Key da Evolution API não está configurada");
  }

  return config;
}

// Função para buscar configurações do banco local como fallback
async function getLocalSettings(instanceName: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}&select=settings`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const connections = await response.json();
    if (connections && connections.length > 0 && connections[0].settings) {
      return connections[0].settings;
    }
  } catch (error) {
    console.error("Erro ao buscar configurações locais:", error);
  }

  return null;
}

// Função para salvar configurações no banco local
async function saveLocalSettings(instanceName: string, settings: any) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return false;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          settings: settings,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Erro ao salvar configurações locais:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { instanceName: string } }
) {
  try {
    const { instanceName } = params;

    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    try {
      // Tentar buscar da Evolution API primeiro
      const config = await getEvolutionConfig();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos

      // Usar o endpoint correto da Evolution API
      const apiUrl = `${config.apiUrl}/settings/find/${instanceName}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          apikey: config.apiKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        // Salvar no banco local para cache
        await saveLocalSettings(instanceName, data);

        return NextResponse.json({
          success: true,
          settings: data,
          source: "evolution_api",
        });
      } else {
        throw new Error(`Evolution API retornou status ${response.status}`);
      }
    } catch (evolutionError: any) {
      console.error("Erro na Evolution API:", evolutionError.message);

      // Tentar buscar do cache local
      const localSettings = await getLocalSettings(instanceName);

      if (localSettings) {
        return NextResponse.json({
          success: true,
          settings: localSettings,
          source: "local_database",
          warning:
            "Evolution API indisponível. Usando configurações do cache local.",
        });
      }

      // Se não tem cache, retornar configurações padrão
      const defaultSettings = {
        groupsIgnore: false,
        readMessages: true,
        alwaysOnline: false,
        readStatus: true,
        rejectCall: false,
        msgCall: "Não posso atender no momento, envie uma mensagem.",
        syncFullHistory: false,
      };

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
        source: "default",
        warning: "Evolution API indisponível. Usando configurações padrão.",
      });
    }
  } catch (error: any) {
    console.error("Erro geral:", error.message);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { instanceName: string } }
) {
  try {
    const { instanceName } = params;
    const settings = await request.json();

    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    try {
      // Buscar configuração da Evolution API
      const config = await getEvolutionConfig();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos para salvar

      // Usar o endpoint correto da Evolution API
      const apiUrl = `${config.apiUrl}/settings/set/${instanceName}`;
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

      if (response.ok) {
        const result = await response.json();

        // Salvar no banco local para sincronização
        await saveLocalSettings(instanceName, settings);

        return NextResponse.json({
          success: true,
          message: "Configurações salvas com sucesso na Evolution API",
          source: "evolution_api",
          data: result,
        });
      } else {
        const errorText = await response.text();
        throw new Error(
          `Evolution API retornou status ${response.status}: ${errorText}`
        );
      }
    } catch (evolutionError: any) {
      console.error("Erro ao salvar na Evolution API:", evolutionError.message);

      // Mesmo com erro na Evolution API, salvar no banco local
      const localSaved = await saveLocalSettings(instanceName, settings);

      if (localSaved) {
        return NextResponse.json(
          {
            success: false,
            error: `Erro na Evolution API: ${evolutionError.message}. Configurações salvas apenas localmente.`,
            source: "local_database",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Erro na Evolution API: ${evolutionError.message}`,
          details: "Verifique se a Evolution API está funcionando corretamente",
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error("Erro geral ao salvar:", error.message);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
