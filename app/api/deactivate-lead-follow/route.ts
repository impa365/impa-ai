import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    // 1. Validar API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 2. Validar parâmetros
    const body = await request.json();
    let { remoteJid, instance_name, instance_token } = body;
    if (!remoteJid || !instance_name || !instance_token) {
      return NextResponse.json({ error: "remoteJid, instance_name e instance_token são obrigatórios" }, { status: 400 });
    }
    remoteJid = String(remoteJid).trim();
    instance_name = String(instance_name).trim();
    instance_token = String(instance_token).trim();

    // 3. Conectar ao Supabase
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    });

    // 4. Buscar conexão pelo par (instance_name, instance_token)
    const { data: connection, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select("id")
      .eq("instance_name", instance_name)
      .eq("instance_token", instance_token)
      .single();
    if (connectionError || !connection) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Conexão WhatsApp não encontrada",
        details: isDev ? connectionError : undefined,
        supabase: isDev ? { instance_name, instance_token } : undefined
      }, { status: 404 });
    }

    // 5. Buscar lead pelo par (whatsappConection, remoteJid)
    const { data: lead, error: findError } = await supabase
      .from("lead_folow24hs")
      .select("id")
      .eq("remoteJid", remoteJid)
      .eq("whatsappConection", connection.id)
      .single();
    if (findError || !lead) {
      return NextResponse.json({ error: "Lead não encontrado para esta conexão" }, { status: 404 });
    }

    // 6. Desativar lead
    const { data: updatedLead, error: updateError } = await supabase
      .from("lead_folow24hs")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id)
      .select()
      .single();
    if (updateError || !updatedLead) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Erro ao desativar lead",
        details: isDev ? updateError : undefined,
        supabase: isDev ? { leadId: lead.id } : undefined
      }, { status: 500 });
    }

    // 7. Retornar sucesso
    return NextResponse.json({
      success: true,
      lead: updatedLead
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
