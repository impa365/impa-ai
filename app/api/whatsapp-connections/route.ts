import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("API: Buscando conexões WhatsApp")

    // Busca simples sem joins
    const { data, error, count } = await supabase
      .from("whatsapp_connections")
      .select("id, connection_name, instance_name, status, user_id, phone_number", { count: "exact" })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("API: Erro ao buscar conexões:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`API: ${data?.length || 0} conexões encontradas`)

    return NextResponse.json({
      success: true,
      connections: data || [],
      count: count || 0,
    })
  } catch (error) {
    console.error("API: Erro geral:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
