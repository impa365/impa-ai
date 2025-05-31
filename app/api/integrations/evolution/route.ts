import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || null,
    })
  } catch (error) {
    console.error("Erro ao buscar integração Evolution API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar configurações",
      },
      { status: 500 },
    )
  }
}
