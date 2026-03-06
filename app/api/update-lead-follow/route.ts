import { type NextRequest, NextResponse } from "next/server";
import { queryOne, buildUpdate } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";

export async function PUT(request: NextRequest) {
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

    // 3. Buscar conexão WhatsApp pelo instance_name
    const connection = await queryOne(
      `SELECT id, user_id FROM whatsapp_connections WHERE instance_name = $1`,
      [instance_name]
    );
    if (!connection) {
      return NextResponse.json({ error: "Conexão WhatsApp não encontrada" }, { status: 404 });
    }
    if (connection.user_id !== userId) {
      return NextResponse.json({ error: "Esta conexão não pertence ao usuário da API Key" }, { status: 403 });
    }

    // 4. Buscar lead pelo remoteJid e whatsappConection
    // ATENÇÃO: O nome dos campos é case sensitive! Use exatamente 'remoteJid' e 'whatsappConection'.
    const lead = await queryOne(
      `SELECT id FROM lead_folow24hs WHERE "remoteJid" = $1 AND "whatsappConection" = $2`,
      [remoteJid, connection.id]
    );
    if (!lead) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Lead não encontrado para esta conexão",
        details: isDev ? "No matching lead found" : undefined,
        supabase: isDev ? { remoteJid, whatsappConection: connection.id } : undefined
      }, { status: 404 });
    }

    // 5. Atualizar lead
    const updateData: any = { dia: dayNumber, updated_at: new Date().toISOString() };
    if (name) updateData.name = String(name).trim();
    // ATENÇÃO: O nome dos campos é case sensitive! Use exatamente 'id' para o update.
    const { text, values } = buildUpdate("lead_folow24hs", updateData, { id: lead.id });
    const updatedLead = await queryOne(text, values);

    if (!updatedLead) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Erro ao atualizar lead",
        details: isDev ? "Update returned no rows" : undefined,
        supabase: isDev ? { updateData, leadId: lead.id } : undefined
      }, { status: 500 });
    }

    // 6. Resposta de sucesso
    return NextResponse.json({
      success: true,
      message: "Lead atualizado com sucesso",
      data: updatedLead,
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
