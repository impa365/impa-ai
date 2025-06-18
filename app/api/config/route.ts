import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Ler configurações PÚBLICAS das variáveis de ambiente do servidor
    // Apenas exponha o que é seguro e necessário para o cliente ANTES do login.
    // SUPABASE_URL e SUPABASE_ANON_KEY para o cliente devem vir de NEXT_PUBLIC_ variáveis.
    const config = {
      nextAuthUrl: process.env.NEXTAUTH_URL,
      customKey: process.env.CUSTOM_KEY, // Exponha apenas se for uma chave pública segura
      // Adicione outras configurações públicas necessárias aqui
      // Exemplo: siteName: process.env.SITE_NAME
    }

    // Log para debug
    console.log("🔧 API Config - Public Environment variables being exposed:")
    console.log("NEXTAUTH_URL:", config.nextAuthUrl ? "✅ Defined" : "⚠️ Missing or not intended to be public")
    console.log("CUSTOM_KEY:", config.customKey ? "✅ Defined" : "⚠️ Missing or not intended to be public")

    // Verificar se as variáveis essenciais PÚBLICAS estão definidas (se houver alguma)
    // Exemplo: se NEXTAUTH_URL é crucial para o cliente antes do login
    if (!config.nextAuthUrl) {
      console.warn("⚠️ API Config - NEXTAUTH_URL is not defined, this might affect client-side auth redirects.")
      // Não retorne erro 500 por isso, a menos que seja crítico.
      // O cliente pode ter fallbacks ou a ausência pode ser esperada em alguns cenários.
    }

    // Retornar configurações válidas
    return NextResponse.json(config)
  } catch (error) {
    console.error("❌ Error in public config API:", error)
    return NextResponse.json({ error: "Failed to load public configuration" }, { status: 500 })
  }
}
