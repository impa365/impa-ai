import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Iniciando processo de registro...");

    const { email, password, full_name } = await request.json();

    if (!email || !password || !full_name) {
      console.log("❌ Dados obrigatórios não fornecidos");
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    console.log("📧 Tentando registrar email:", email);

    // Usar fetch direto para o Supabase REST API
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY; // Usar anon key para criar usuário

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Configuração do Supabase não encontrada");
      return NextResponse.json(
        { error: "Erro de configuração do servidor" },
        { status: 500 }
      );
    }

    // Verificar se usuário já existe
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?email=eq.${email}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (checkResponse.ok) {
      const existingUsers = await checkResponse.json();
      if (existingUsers && existingUsers.length > 0) {
        console.log("❌ Email já cadastrado");
        return NextResponse.json(
          { error: "Este email já está cadastrado" },
          { status: 400 }
        );
      }
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Buscar limites padrão da tabela system_settings
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    };

    // Buscar limite padrão de agentes
    const agentsLimitResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.default_agents_limit`,
      { headers }
    );
    let defaultAgentsLimit = 1; // Padrão seguro
    if (agentsLimitResponse.ok) {
      const agentsData = await agentsLimitResponse.json();
      if (agentsData && agentsData.length > 0) {
        defaultAgentsLimit = parseInt(agentsData[0].setting_value) || 1;
      }
    }

    // Buscar limite padrão de conexões WhatsApp
    const connectionsLimitResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.default_whatsapp_connections_limit`,
      { headers }
    );
    let defaultConnectionsLimit = 1; // Padrão seguro
    if (connectionsLimitResponse.ok) {
      const connectionsData = await connectionsLimitResponse.json();
      if (connectionsData && connectionsData.length > 0) {
        defaultConnectionsLimit = parseInt(connectionsData[0].setting_value) || 1;
      }
    }

    console.log(`📊 Limites do sistema: agents=${defaultAgentsLimit}, connections=${defaultConnectionsLimit}`);

    // Criar usuário via REST API
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        email,
        full_name,
        password: passwordHash,
        role: "user",
        status: "active",
        agents_limit: defaultAgentsLimit,
        connections_limit: defaultConnectionsLimit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error("❌ Erro ao criar usuário:", errorData);
      return NextResponse.json(
        { error: "Erro ao criar conta" },
        { status: 500 }
      );
    }

    const newUsers = await createResponse.json();
    const newUser = newUsers[0];

    console.log("✅ Usuário criado com sucesso:", newUser.email);

    // Retornar dados do usuário (sem senha)
    const userData = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      status: newUser.status,
      created_at: newUser.created_at,
    };

    return NextResponse.json({
      user: userData,
      message: "Conta criada com sucesso",
    });
  } catch (error: any) {
    console.error("💥 Erro crítico no registro:", error.message);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
