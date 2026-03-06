import { type NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";

// Endpoint DELETE para remover um lead do follow up
export async function DELETE(request: NextRequest) {
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

    // 3. Buscar conexão pelo par (instance_name, instance_token)
    const connection = await queryOne(
      `SELECT id FROM whatsapp_connections WHERE instance_name = $1 AND instance_token = $2`,
      [instance_name, instance_token]
    );
    if (!connection) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Conexão WhatsApp não encontrada",
        details: isDev ? "No matching connection found" : undefined,
        supabase: isDev ? { instance_name, instance_token } : undefined
      }, { status: 404 });
    }

    // 4. Buscar lead pelo par (whatsappConection, remoteJid)
    const lead = await queryOne(
      `SELECT id FROM lead_folow24hs WHERE "remoteJid" = $1 AND "whatsappConection" = $2`,
      [remoteJid, connection.id]
    );
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado para esta conexão" }, { status: 404 });
    }

    // 5. Deletar lead
    await query('DELETE FROM lead_folow24hs WHERE id = $1', [lead.id]);

    // 6. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: "Lead deletado com sucesso",
      leadId: lead.id
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
