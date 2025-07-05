import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação da API Key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Usuário da API Key não encontrado" }, { status: 401 });
    }

    // 2. Validação dos parâmetros
    if (request.headers.get("content-type") !== "application/json") {
      return NextResponse.json({ error: "Content-Type deve ser application/json" }, { status: 400 });
    }
    const body = await request.json();
    let { remoteJid, instance_name, dia, name } = body;
    if (!remoteJid || !instance_name) {
      return NextResponse.json({ error: "remoteJid e instance_name são obrigatórios" }, { status: 400 });
    }
    remoteJid = String(remoteJid).trim();
    instance_name = String(instance_name).trim();
    if (dia === undefined) {
      return NextResponse.json({ error: "dia é obrigatório" }, { status: 400 });
    }
    const dayNumber = Number.parseInt(dia.toString(), 10);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json({ error: "dia deve ser um número entre 1 e 30" }, { status: 400 });
    }

    // 3. Conexão com o Supabase
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    });

    // 4. Buscar conexão WhatsApp pelo instance_name
    const { data: connection, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select("id, user_id")
      .eq("instance_name", instance_name)
      .single();
    if (connectionError || !connection) {
      return NextResponse.json({ error: "Conexão WhatsApp não encontrada" }, { status: 404 });
    }
    if (connection.user_id !== userId) {
      return NextResponse.json({ error: "Esta conexão não pertence ao usuário da API Key" }, { status: 403 });
    }

    // 5. Buscar lead pelo remoteJid e whatsappConection
    // ATENÇÃO: O nome correto da tabela é 'lead_folow24hs' (apenas 1 'l' após o 'fo')
    const { data: lead, error: findError } = await supabase
      .from("lead_folow24hs")
      .select("id")
      .eq("remoteJid", remoteJid)
      .eq("whatsappConection", connection.id)
      .single();
    if (findError || !lead) {
      return NextResponse.json({ error: "Lead não encontrado para esta conexão" }, { status: 404 });
    }

    // 6. Atualizar lead
    const updateData: any = { dia: dayNumber, updated_at: new Date().toISOString() };
    if (name) updateData.name = String(name).trim();
    // ATENÇÃO: O nome correto da tabela é 'lead_folow24hs' (apenas 1 'l' após o 'fo')
    const { data: updatedLead, error: updateError } = await supabase
      .from("lead_folow24hs")
      .update(updateData)
      .eq("id", lead.id)
      .select()
      .single();
    if (updateError) {
      return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 });
    }

    // 7. Resposta de sucesso
    return NextResponse.json({
      success: true,
      message: "Lead atualizado com sucesso",
      data: updatedLead,
    });
  } catch (error) {
    // Não vazar detalhes sensíveis
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
