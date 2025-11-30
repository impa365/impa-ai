import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyRefreshToken, generateTokenPair, logJWTOperation } from "@/lib/jwt"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshTokenCookie = cookieStore.get("impaai_refresh_token")

    if (!refreshTokenCookie) {
      return NextResponse.json({ error: "Token de atualização não encontrado" }, { status: 401 })
    }

    try {
      // Verificar refresh token
      const refreshPayload = verifyRefreshToken(refreshTokenCookie.value)

      // Buscar dados atuais do usuário no banco
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Configuração do Supabase não encontrada")
        return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
      }

      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      }

      // Buscar usuário atual
      const userResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${refreshPayload.id}&select=*`, {
        headers,
      })

      if (!userResponse.ok) {
        console.error("❌ Erro ao buscar usuário para refresh")
        logJWTOperation('REFRESH', refreshPayload.email, false, 'Usuário não encontrado')
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
      }

      const users = await userResponse.json()
      if (!users || users.length === 0) {
        console.log("❌ Usuário não existe mais")
        logJWTOperation('REFRESH', refreshPayload.email, false, 'Usuário removido')
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
      }

      const user = users[0]

      // Verificar se usuário ainda está ativo
      if (user.status !== "active") {
        console.log("❌ Usuário inativo durante refresh")
        logJWTOperation('REFRESH', refreshPayload.email, false, 'Usuário inativo')
        return NextResponse.json({ error: "Conta inativa" }, { status: 401 })
      }

      // Gerar novos tokens
      const newTokens = generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      })

      logJWTOperation('REFRESH', user.email, true, `Role: ${user.role}`)

      // Preparar dados do usuário
      const userData = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
      }

      // Criar resposta com cookies usando NextResponse
      const response = NextResponse.json({
        user: userData,
        tokens: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        },
        message: "Tokens atualizados com sucesso",
      })

      // Definir cookies na resposta
      response.cookies.set("impaai_access_token", newTokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hora
        path: "/",
      })

      response.cookies.set("impaai_refresh_token", newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: "/",
      })

      response.cookies.set("impaai_user", JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })

      return response

    } catch (refreshError) {
      console.log("❌ Refresh token inválido:", (refreshError as Error).message)
      logJWTOperation('REFRESH', 'unknown', false, (refreshError as Error).message)
      
      // Criar resposta de erro e limpar cookies
      const response = NextResponse.json({ error: "Token de atualização inválido" }, { status: 401 })
      
      response.cookies.delete("impaai_access_token")
      response.cookies.delete("impaai_refresh_token")
      response.cookies.delete("impaai_user")
      
      return response
    }

  } catch (error: any) {
    console.error("💥 Erro crítico no refresh:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
} 