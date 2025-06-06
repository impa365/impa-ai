import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Obter API key do cabeçalho
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.headers.get("x-auth-token")

    if (!apiKey) {
      console.log("❌ API key não fornecida")
      return NextResponse.json({ error: "API key não fornecida" }, { status: 401 })
    }

    console.log("🔑 Verificando API key:", apiKey.substring(0, 10) + "...")

    // Verificar se a API key existe
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("id, email, role, status")
      .eq("api_key", apiKey)
      .eq("status", "active")
      .single()

    if (userError || !userData) {
      console.log("❌ API key inválida ou usuário inativo")
      return NextResponse.json({ error: "API key inválida ou usuário inativo" }, { status: 401 })
    }

    console.log("✅ API key válida para usuário:", userData.email)

    // Buscar bots do usuário
    const { data: bots, error: botsError } = await supabase
      .from("ai_agents")
      .select(`
        id, 
        name, 
        description, 
        status, 
        model, 
        temperature,
        transcribe_audio,
        understand_images,
        voice_response_enabled,
        voice_provider,
        voice_id,
        calendar_integration,
        chatnode_integration,
        orimon_integration,
        whatsapp_connection_id,
        whatsapp_connections:whatsapp_connection_id (
          connection_name,
          instance_name,
          phone_number,
          status
        )
      `)
      .eq("user_id", userData.id)
      .eq("status", "active")

    if (botsError) {
      console.error("❌ Erro ao buscar bots:", botsError)
      return NextResponse.json({ error: "Erro ao buscar bots" }, { status: 500 })
    }

    console.log(`✅ ${bots?.length || 0} bots encontrados`)

    return NextResponse.json({
      success: true,
      bots: bots || [],
    })
  } catch (error: any) {
    console.error("💥 Erro geral:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
