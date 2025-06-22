import { type NextRequest, NextResponse } from "next/server";

// Função para gerar token único
function generateInstanceToken(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16).toUpperCase();
  });
}

// Função para gerar nome da instância
function generateInstanceName(
  platformName: string,
  connectionName: string
): string {
  const randomNumber = Math.floor(Math.random() * 9999) + 1000;
  const cleanConnectionName = connectionName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const cleanPlatformName = platformName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return `${cleanPlatformName}_${cleanConnectionName}_${randomNumber}`;
}

// Função para verificar se nome/token já existe
async function checkInstanceExists(
  instanceName: string,
  token: string
): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configuração do banco não encontrada");
  }

  const headers = {
    "Content-Type": "application/json",
    "Accept-Profile": "impaai",
    "Content-Profile": "impaai",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  const response = await fetch(
    `${supabaseUrl}/rest/v1/whatsapp_connections?select=id&or=(instance_name.eq.${instanceName},instance_token.eq.${token})&limit=1`,
    { headers }
  );

  if (!response.ok) {
    throw new Error("Erro ao verificar instância existente");
  }

  const data = await response.json();
  return (data?.length || 0) > 0;
}

// Função para validar se a resposta é JSON
function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type");
  return contentType && contentType.includes("application/json");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionName, userId } = body;

    if (!connectionName || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Nome da conexão e ID do usuário são obrigatórios",
        },
        { status: 400 }
      );
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

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

    // Buscar configurações da Evolution API
    const integrationResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=config&type=eq.evolution_api&is_active=eq.true&limit=1`,
      { headers }
    );

    if (!integrationResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao buscar configuração da Evolution API",
        },
        { status: 500 }
      );
    }

    const integrationData = await integrationResponse.json();

    if (!integrationData || integrationData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada" },
        { status: 400 }
      );
    }

    const config = integrationData[0].config;

    if (!config?.apiUrl || !config?.apiKey) {
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada corretamente" },
        { status: 400 }
      );
    }

    // Validar URL da API
    let apiUrl: string;
    try {
      const url = new URL(config.apiUrl);
      apiUrl = url.toString().replace(/\/$/, ""); // Remove trailing slash
    } catch (urlError) {
      return NextResponse.json(
        {
          success: false,
          error: "URL da Evolution API inválida na configuração",
        },
        { status: 400 }
      );
    }

    // Buscar nome da plataforma
    const themeResponse = await fetch(
      `${supabaseUrl}/rest/v1/global_theme_config?select=system_name&order=created_at.desc&limit=1`,
      { headers }
    );

    let platformName = "impaai";
    if (themeResponse.ok) {
      const themeData = await themeResponse.json();
      if (themeData && themeData.length > 0 && themeData[0].system_name) {
        platformName = themeData[0].system_name;
      }
    }

    // Gerar nome e token únicos
    let instanceName: string;
    let token: string;
    let attempts = 0;

    do {
      instanceName = generateInstanceName(platformName, connectionName);
      token = generateInstanceToken();
      attempts++;

      if (attempts > 10) {
        return NextResponse.json(
          {
            success: false,
            error: "Erro ao gerar identificadores únicos. Tente novamente.",
          },
          { status: 500 }
        );
      }
    } while (await checkInstanceExists(instanceName, token));

    // Criar instância na Evolution API
    const requestBody = {
      instanceName,
      token,
      integration: "WHATSAPP-BAILEYS",
    };

    console.log("Fazendo requisição para Evolution API...");

    const evolutionResponse = await fetch(`${apiUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    // Verificar se a resposta é JSON válido
    if (!isJsonResponse(evolutionResponse)) {
      const responseText = await evolutionResponse.text();
      console.error("Evolution API retornou resposta não-JSON:", {
        status: evolutionResponse.status,
        statusText: evolutionResponse.statusText,
        contentType: evolutionResponse.headers.get("content-type"),
        responsePreview: responseText.substring(0, 200) + "...",
      });

      return NextResponse.json(
        {
          success: false,
          error: `Evolution API retornou resposta inválida. Status: ${evolutionResponse.status}. Verifique se a URL e chave da API estão corretas.`,
        },
        { status: 500 }
      );
    }

    if (!evolutionResponse.ok) {
      let errorMessage = `Erro ${evolutionResponse.status}`;
      try {
        const errorData = await evolutionResponse.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${evolutionResponse.statusText}`;
      }

      console.error("Erro na Evolution API ao criar instância:", {
        status: evolutionResponse.status,
        statusText: evolutionResponse.statusText,
        error: errorMessage,
      });

      return NextResponse.json(
        { success: false, error: `Erro na Evolution API: ${errorMessage}` },
        { status: 500 }
      );
    }

    let evolutionData: any;
    try {
      evolutionData = await evolutionResponse.json();
    } catch (jsonError) {
      console.error("Erro ao fazer parse do JSON da resposta:", jsonError);
      return NextResponse.json(
        {
          success: false,
          error: "Resposta da Evolution API não é um JSON válido.",
        },
        { status: 500 }
      );
    }

    // Verificar se a resposta tem a estrutura esperada
    if (
      !evolutionData ||
      (!Array.isArray(evolutionData) && !evolutionData.instance)
    ) {
      console.error(
        "Resposta da Evolution API tem estrutura inesperada:",
        evolutionData
      );
      return NextResponse.json(
        {
          success: false,
          error: "Resposta da Evolution API tem formato inesperado.",
        },
        { status: 500 }
      );
    }

    // Salvar no banco de dados
    const connectionData = {
      user_id: userId,
      connection_name: connectionName,
      instance_name: instanceName,
      instance_id: Array.isArray(evolutionData)
        ? evolutionData[0]?.instance?.instanceId || null
        : evolutionData.instance?.instanceId || null,
      instance_token: token,
      status: "disconnected",
    };

    const saveResponse = await fetch(
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

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error("Erro ao salvar conexão no banco de dados:", errorText);
      return NextResponse.json(
        { success: false, error: "Erro ao salvar conexão no banco de dados." },
        { status: 500 }
      );
    }

    const savedConnection = await saveResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        connection: Array.isArray(savedConnection)
          ? savedConnection[0]
          : savedConnection,
        evolutionResponse: Array.isArray(evolutionData)
          ? evolutionData[0]
          : evolutionData,
      },
    });
  } catch (error: any) {
    console.error("Erro interno ao criar instância:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Erro interno: ${error.message || "Erro desconhecido"}`,
      },
      { status: 500 }
    );
  }
}
