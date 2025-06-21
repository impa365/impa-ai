import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateApiKey } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const user = authResult.user
    const { searchParams } = new URL(request.url)
    const instanceName = searchParams.get("instance_name")

    if (!instanceName) {
      return NextResponse.json({ error: "instance_name parameter is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    // Buscar configuração de follow-up
    const { data: config, error: configError } = await supabase
      .from("followup_24hs")
      .select(`
        *,
        followup_messages(*)
      `)
      .eq("user_id", user.id)
      .eq("instance_name", instanceName)
      .single()

    if (configError && configError.code !== "PGRST116") {
      console.error("Error fetching followup config:", configError)
      return NextResponse.json({ error: "Failed to fetch followup configuration" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: config || null,
    })
  } catch (error) {
    console.error("Error in followup-config GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const user = authResult.user
    const body = await request.json()
    const { instanceName, companyName, messages } = body

    if (!instanceName) {
      return NextResponse.json({ error: "instanceName is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    // Criar ou atualizar configuração de follow-up
    const { data: config, error: configError } = await supabase
      .from("followup_24hs")
      .upsert({
        user_id: user.id,
        instance_name: instanceName,
        company_name: companyName,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (configError) {
      console.error("Error creating/updating followup config:", configError)
      return NextResponse.json({ error: "Failed to create/update followup configuration" }, { status: 500 })
    }

    // Se mensagens foram fornecidas, atualizar
    if (messages && Array.isArray(messages)) {
      // Remover mensagens existentes
      await supabase.from("followup_messages").delete().eq("followup_config_id", config.id)

      // Inserir novas mensagens
      const messagesToInsert = messages.map((msg) => ({
        followup_config_id: config.id,
        day_number: msg.dayNumber,
        message_text: msg.messageText,
        media_url: msg.mediaUrl,
        media_type: msg.mediaType || "text",
        is_active: true,
      }))

      const { error: messagesError } = await supabase.from("followup_messages").insert(messagesToInsert)

      if (messagesError) {
        console.error("Error inserting followup messages:", messagesError)
        return NextResponse.json({ error: "Failed to create followup messages" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Followup configuration created/updated successfully",
      data: config,
    })
  } catch (error) {
    console.error("Error in followup-config POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
