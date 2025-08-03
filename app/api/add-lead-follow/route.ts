import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint para adicionar um novo lead ao follow up (apenas dia 1, sem atualizar existentes)
export async function POST(request: NextRequest) {
  try {
    // 1. Validação dos parâmetros recebidos
    const body = await request.json();
    let { remoteJid, instance_name } = body;
    if (!remoteJid || !instance_name) {
      return NextResponse.json({ error: "remoteJid e instance_name são obrigatórios" }, { status: 400 });
    }
    remoteJid = String(remoteJid).trim();
    instance_name = String(instance_name).trim();

    // 2. Conexão com o Supabase usando o schema correto
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    });

    // 3. Buscar o UUID da conexão pelo instance_name
    const { data: connection, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select("id")
      .eq("instance_name", instance_name)
      .single();
    if (connectionError || !connection) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Conexão WhatsApp não encontrada",
        details: isDev ? connectionError : undefined,
        supabase: isDev ? { instance_name } : undefined
      }, { status: 404 });
    }

    // 4. Verificar se já existe lead para o mesmo remoteJid e conexão
    const { data: existingLead, error: findError } = await supabase
      .from("lead_folow24hs")
      .select("id")
      .eq("remoteJid", remoteJid)
      .eq("whatsappConection", connection.id)
      .single();
    if (existingLead) {
      return NextResponse.json({
        error: "Lead já existe para esta conexão",
        details: "Já existe um lead com este remoteJid para esta conexão. Não é permitido atualizar.",
      }, { status: 409 });
    }

    // 5. Criar novo lead com dia=1
    const { data: newLead, error: insertError } = await supabase
      .from("lead_folow24hs")
      .insert({
        whatsappConection: connection.id,
        remoteJid,
        dia: 1,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (insertError) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Erro ao criar lead",
        details: isDev ? insertError : undefined,
        supabase: isDev ? { whatsappConection: connection.id, remoteJid } : undefined
      }, { status: 500 });
    }

    // 6. Retornar lead criado
    return NextResponse.json({
      success: true,
      lead: newLead
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
