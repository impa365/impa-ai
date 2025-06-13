import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const isConfigured =
      supabaseUrl &&
      supabaseKey &&
      supabaseUrl !== "https://placeholder.supabase.co" &&
      supabaseKey !== "placeholder-anon-key"

    if (!isConfigured) {
      return NextResponse.json(
        {
          status: "error",
          message: "Variáveis de ambiente não configuradas",
          supabaseUrl: supabaseUrl || "não definida",
          supabaseKeyConfigured: !!supabaseKey,
        },
        { status: 500 },
      )
    }

    // Testar conexão com Supabase
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return NextResponse.json({
        status: "healthy",
        message: "Aplicação funcionando corretamente",
        supabase: {
          url: new URL(supabaseUrl).hostname,
          connected: true,
          httpStatus: response.status,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return NextResponse.json(
        {
          status: "error",
          message: "Erro na conexão com Supabase",
          error: error instanceof Error ? error.message : "Erro desconhecido",
          supabase: {
            url: new URL(supabaseUrl).hostname,
            connected: false,
          },
        },
        { status: 500 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
