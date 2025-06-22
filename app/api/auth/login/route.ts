import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { generateTokenPair, logJWTOperation } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("🔐 Tentativa de login para:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Configuração do Supabase não encontrada");
      return NextResponse.json(
        { error: "Erro de configuração do servidor" },
        { status: 500 }
      );
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    };

    // Buscar usuário por email
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?email=eq.${email}&select=*`,
      {
        headers,
      }
    );

    if (!userResponse.ok) {
      console.error("❌ Erro ao buscar usuário:", userResponse.status);
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      );
    }

    const users = await userResponse.json();

    if (!users || users.length === 0) {
      console.log("❌ Usuário não encontrado:", email);
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verificar senha usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("❌ Senha incorreta para:", email);
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Verificar se usuário está ativo
    if (user.status !== "active") {
      console.log("❌ Usuário inativo:", email);
      return NextResponse.json({ error: "Conta inativa" }, { status: 401 });
    }

    // Atualizar último login
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          last_login_at: new Date().toISOString(),
          login_count: (user.login_count || 0) + 1,
        }),
      }
    );

    if (!updateResponse.ok) {
      console.warn("⚠️ Não foi possível atualizar último login");
    }

    // Preparar dados do usuário (sem senha)
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: new Date().toISOString(),
    };

    console.log("✅ Login bem-sucedido para:", email, "- Role:", user.role);

    try {
      // Gerar tokens JWT
      const tokens = generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      });

      // Log de auditoria JWT
      logJWTOperation("LOGIN", user.email, true, `Role: ${user.role}`);

      // Definir cookies - tanto JWT quanto dados do usuário para compatibilidade
      const cookieStore = await cookies();

      // Cookie com JWT (para APIs)
      cookieStore.set("impaai_access_token", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 15, // 15 minutos (mesmo tempo do JWT)
        path: "/",
      });

      // Cookie com refresh token
      cookieStore.set("impaai_refresh_token", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: "/",
      });

      // Cookie com dados do usuário (para compatibilidade com sistema existente)
      cookieStore.set("impaai_user", JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: "/",
      });

      return NextResponse.json({
        user: userData,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        message: "Login realizado com sucesso",
      });
    } catch (jwtError) {
      console.error("❌ Erro ao gerar tokens JWT:", jwtError);
      logJWTOperation("LOGIN", user.email, false, "Erro ao gerar tokens");

      // Fallback: usar apenas cookie tradicional se JWT falhar
      const cookieStore = await cookies();
      cookieStore.set("impaai_user", JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return NextResponse.json({
        user: userData,
        message: "Login realizado com sucesso (modo compatibilidade)",
      });
    }
  } catch (error: any) {
    console.error("💥 Erro crítico no login:", error.message);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
