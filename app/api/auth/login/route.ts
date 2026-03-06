import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { generateTokenPair, logJWTOperation } from "@/lib/jwt";
import { checkRateLimit, getRequestIdentifier, RATE_LIMITS } from "@/lib/rate-limit";
import { logLoginAttempt, logRateLimitExceeded } from "@/lib/security-audit";
import { queryOne } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // 🔒 RATE LIMITING - Prevenir força bruta
    const identifier = getRequestIdentifier(request)
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.AUTH)
    
    if (!rateLimit.allowed) {
      console.warn(`⚠️ [RATE-LIMIT] Bloqueado: ${identifier} - Tente novamente em ${rateLimit.retryAfter}s`)
      logRateLimitExceeded(undefined, email || 'desconhecido', '/api/auth/login', request)
      return NextResponse.json(
        { 
          error: `Muitas tentativas de login. Tente novamente em ${rateLimit.retryAfter} segundos.`,
          retryAfter: rateLimit.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter!.toString(),
            'X-RateLimit-Limit': RATE_LIMITS.AUTH.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          }
        }
      );
    }

    const { email, password } = await request.json();

    console.log("🔐 Tentativa de login para:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar usuário por email
    const user = await queryOne('SELECT * FROM user_profiles WHERE email = $1', [email]);

    if (!user) {
      console.log("❌ Usuário não encontrado:", email);
      logLoginAttempt(email, false, request, 'Usuário não encontrado')
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Verificar senha usando bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      console.log("❌ Senha incorreta para:", email);
      logLoginAttempt(email, false, request, 'Senha incorreta')
      return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 })
    }

    // Verificar se usuário está ativo
    if (user.status !== "active") {
      console.log("❌ Usuário inativo:", email);
      return NextResponse.json({ error: "Conta inativa" }, { status: 401 });
    }

    // Atualizar último login
    try {
      await queryOne('UPDATE user_profiles SET last_login_at = $1, login_count = $2 WHERE id = $3', [new Date().toISOString(), (user.login_count || 0) + 1, user.id]);
    } catch (updateError) {
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
      logLoginAttempt(user.email, true, request);

      // Definir cookies - tanto JWT quanto dados do usuário para compatibilidade
      const cookieStore = await cookies();

      // Cookie com JWT (para APIs)
      cookieStore.set("impaai_access_token", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hora (mesmo tempo do JWT)
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
