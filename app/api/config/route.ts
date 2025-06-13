import { NextResponse } from "next/server"

export async function GET() {
  // Valores padrão para desenvolvimento/preview
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co"
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

  // Verificar se estamos em produção e se temos as variáveis de ambiente
  const isProduction = process.env.NODE_ENV === "production"
  const hasEnvVars = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY

  // Em produção, se não tivermos as variáveis, retornar erro
  if (isProduction && !hasEnvVars) {
    console.error("❌ Variáveis de ambiente do Supabase não encontradas em produção!")
    return NextResponse.json(
      { error: "Configuração do servidor incompleta. Verifique as variáveis de ambiente." },
      { status: 500 },
    )
  }

  // Return the environment variables needed by the client
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  })
}
