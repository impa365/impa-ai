import { NextResponse } from "next/server"

export async function GET() {
  // Estas variáveis são lidas do ambiente do servidor (onde o Portainer as injeta)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Variáveis de ambiente Supabase não configuradas no servidor para /api/config")
    return NextResponse.json(
      {
        error: "Server configuration error: Supabase environment variables not set.",
        supabaseUrl: null, // Explicitamente nulo para o cliente saber
        supabaseAnonKey: null,
      },
      { status: 500 },
    )
  }

  // console.log('✅ /api/config: Fornecendo Supabase URL e Anon Key');
  return NextResponse.json({
    supabaseUrl,
    supabaseAnonKey,
  })
}
