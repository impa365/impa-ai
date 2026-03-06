import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne, queryMany, rpc, buildInsert } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Iniciando processo de registro...");

    // Verificar se cadastro público está habilitado
    let regEnabled = false;
    try {
      const result = await rpc('is_public_registration_allowed');
      regEnabled = result === true;
    } catch (e) {
      console.error("❌ Erro ao verificar registro público:", e);
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

    // Verificar se usuário já existe
    const existingUsers = await queryMany('SELECT * FROM user_profiles WHERE email = $1', [email]);
    if (existingUsers && existingUsers.length > 0) {
      console.log("❌ Email já cadastrado");
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Buscar limites padrão do banco de dados
    let defaultAgentsLimit = 1;
    let defaultConnectionsLimit = 1;
    try {
      const settings = await queryMany('SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ($1, $2)', ['default_agents_limit', 'max_connections_per_user']);
      for (const setting of settings) {
        if (setting.setting_key === "default_agents_limit") {
          defaultAgentsLimit = parseInt(setting.setting_value) || 1;
        }
        if (setting.setting_key === "max_connections_per_user") {
          defaultConnectionsLimit = parseInt(setting.setting_value) || 1;
        }
      }
    } catch (e) {
      console.warn(
        "Não foi possível buscar limites padrão do banco, usando fallback 1."
      );
    }

    // Criar usuário via PostgreSQL
    const insertQuery = buildInsert('user_profiles', {
      email,
      full_name,
      password: passwordHash,
      role: "user",
      status: "active",
      agents_limit: defaultAgentsLimit,
      connections_limit: defaultConnectionsLimit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const newUser = await queryOne(insertQuery.text, insertQuery.values);

    if (!newUser) {
      console.error("❌ Erro ao criar usuário");
      return NextResponse.json(
        { error: "Erro ao criar conta" },
        { status: 500 }
      );
    }

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
