import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint para buscar informações completas de uma conexão WhatsApp
export async function POST(request: NextRequest) {
  try {
    // 1. Validação dos parâmetros recebidos
    const body = await request.json();
    let { instance_name, instance_token } = body;
    if (!instance_name || !instance_token) {
      return NextResponse.json({ error: "instance_name e instance_token são obrigatórios" }, { status: 400 });
    }
    instance_name = String(instance_name).trim();
    instance_token = String(instance_token).trim();

    // 2. Conexão com o Supabase usando o schema correto
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    });

    // 3. Buscar a conexão pelo instance_name e instance_token
    const { data: connection, error: findError } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("instance_name", instance_name)
      .eq("instance_token", instance_token)
      .single();
    if (findError || !connection) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Conexão não encontrada",
        details: isDev ? findError : undefined,
        supabase: isDev ? { instance_name, instance_token } : undefined
      }, { status: 404 });
    }

    // 4. Retornar todos os dados da conexão
    return NextResponse.json({
      success: true,
      connection
    });
  } catch (error) {
    // Não vazar detalhes sensíveis em produção
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        error: "Internal server error",
        details: isDev ? String(error) : undefined
      },
      { status: 500 }
    );
  }
} 