import { NextResponse } from "next/server"

export async function GET() {
  // Estas variáveis são lidas do ambiente do servidor (onde o Portainer as injeta)
  // Usamos NEXT_PUBLIC_ prefixadas porque o cliente espera esses nomes,
  // mas elas são lidas do ambiente do SERVIDOR aqui.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "❌ Variáveis de ambiente Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) não configuradas no servidor para /api/config",
    )
    return NextResponse.json(
      {
        error: "Server configuration error: Supabase environment variables not set on the server.",
        supabaseUrl: null,
        supabaseAnonKey: null,
      },
      { status: 500 },
    )
  }

  // console.log('✅ /api/config: Fornecendo Supabase URL e Anon Key para o cliente');
  return NextResponse.json({
    // Retorna com os nomes que o cliente espera
    supabaseUrl: supabaseUrl, // Poderia ser renomeado para NEXT_PUBLIC_SUPABASE_URL se o cliente esperar exatamente isso
    supabaseAnonKey: supabaseAnonKey, // Poderia ser renomeado para NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
}
