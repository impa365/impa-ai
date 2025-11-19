import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Iniciando processo de registro...");

    // Verificar se cadastro público está habilitado
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Configuração do Supabase não encontrada");
      return NextResponse.json(
        { error: "Erro de configuração do servidor" },
        { status: 500 }
      );
    }
    const regSettingResp = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?select=setting_value&setting_key=eq.allow_public_registration`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    let regEnabled = false;
    if (regSettingResp.ok) {
      const regSettings = await regSettingResp.json();
      if (regSettings && regSettings.length > 0) {
        regEnabled =
          String(regSettings[0].setting_value).toLowerCase() === "true";
      }
    }
    if (!regEnabled) {
      // Pegadinha/piada
      const customMsg = "Infelizmente, você não pode se cadastrar agora. Tente novamente quando Saturno estiver em Capricórnio ou peça permissão para o administrador. 😜";
      return NextResponse.json(
        {
          error: customMsg,
          message: customMsg,
          joke: "Por que o programador não pode se cadastrar? Porque o cadastro está em modo ninja! 🥷",
        },
        { status: 403 }
      );
    }

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
    // const supabaseUrl = process.env.SUPABASE_URL;
    // const supabaseKey = process.env.SUPABASE_ANON_KEY; // Usar anon key para criar usuário

    // if (!supabaseUrl || !supabaseKey) {
    //   console.error("❌ Configuração do Supabase não encontrada");
    //   return NextResponse.json(
    //     { error: "Erro de configuração do servidor" },
    //     { status: 500 }
    //   );
    // }

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

    // Buscar limites padrão do banco de dados
    let defaultAgentsLimit = 1;
    let defaultConnectionsLimit = 1;
    try {
      const settingsResponse = await fetch(
        `${supabaseUrl}/rest/v1/system_settings?select=setting_key,setting_value&setting_key=in.(default_agents_limit,max_connections_per_user)`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        for (const setting of settings) {
          if (setting.setting_key === "default_agents_limit") {
            defaultAgentsLimit = parseInt(setting.setting_value) || 1;
          }
          if (setting.setting_key === "max_connections_per_user") {
            defaultConnectionsLimit = parseInt(setting.setting_value) || 1;
          }
        }
      }
    } catch (e) {
      console.warn(
        "Não foi possível buscar limites padrão do banco, usando fallback 1."
      );
    }

    // Criar usuário via REST API
    const createResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
        body: JSON.stringify({
          email,
          full_name,
          password: passwordHash, // Corrigido: usar 'password' ao invés de 'password_hash'
          role: "user",
          status: "active",
          agents_limit: defaultAgentsLimit,
          connections_limit: defaultConnectionsLimit,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      }
    );

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
