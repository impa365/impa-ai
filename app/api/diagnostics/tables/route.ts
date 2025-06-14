import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificar variáveis de ambiente
    const envCheck = {
      SUPABASE_URL: process.env.SUPABASE_URL ? "✅ Defined" : "❌ Missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "✅ Defined" : "❌ Missing",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Defined" : "❌ Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Defined" : "❌ Missing",
    }

    // URLs para teste manual
    const testUrls = {
      supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      restEndpoint: `${process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      systemThemesUrl: `${process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/system_themes?select=*&limit=1`,
      systemSettingsUrl: `${process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/system_settings?select=*&limit=1`,
    }

    // Teste direto com fetch
    const directTests: any = {}

    try {
      const response = await fetch(testUrls.systemThemesUrl!, {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
      })

      directTests.system_themes = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      }

      if (response.ok) {
        const data = await response.json()
        directTests.system_themes.data = data
      } else {
        const errorText = await response.text()
        directTests.system_themes.error = errorText
      }
    } catch (error: any) {
      directTests.system_themes = {
        status: "exception",
        error: error.message,
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      testUrls,
      directTests,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
