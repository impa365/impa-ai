import { NextResponse } from "next/server"

export async function GET() {
  // Retorna as variáveis de ambiente em runtime
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  }

  // Gera o JavaScript que será executado no cliente
  const jsContent = `
    window.__RUNTIME_ENV__ = ${JSON.stringify(envVars)};
    console.log('🔄 Runtime environment variables loaded:', {
      url: window.__RUNTIME_ENV__.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: window.__RUNTIME_ENV__.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***definido***' : 'não definido'
    });
  `

  return new NextResponse(jsContent, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
