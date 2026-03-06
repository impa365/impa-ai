import { type NextRequest, NextResponse } from "next/server";
import { queryOne, buildInsert } from "@/lib/db";

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

    // 2. Buscar o UUID da conexão pelo instance_name
    const connection = await queryOne(
      `SELECT id FROM whatsapp_connections WHERE instance_name = $1`,
      [instance_name]
    );
    if (!connection) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Conexão WhatsApp não encontrada",
        details: isDev ? "No matching connection found" : undefined,
        supabase: isDev ? { instance_name } : undefined
      }, { status: 404 });
    }

    // 3. Verificar se já existe lead para o mesmo remoteJid e conexão
    const existingLead = await queryOne(
      `SELECT id FROM lead_folow24hs WHERE "remoteJid" = $1 AND "whatsappConection" = $2`,
      [remoteJid, connection.id]
    );
    if (existingLead) {
      return NextResponse.json({
        error: "Lead já existe para esta conexão",
        details: "Já existe um lead com este remoteJid para esta conexão. Não é permitido atualizar.",
      }, { status: 409 });
    }

    // 4. Criar novo lead com dia=1
    const { text, values } = buildInsert("lead_folow24hs", {
      whatsappConection: connection.id,
      remoteJid,
      dia: 1,
      updated_at: new Date().toISOString(),
    });
    const newLead = await queryOne(text, values);

    if (!newLead) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Erro ao criar lead",
        details: isDev ? "Insert returned no rows" : undefined,
        supabase: isDev ? { whatsappConection: connection.id, remoteJid } : undefined
      }, { status: 500 });
    }

    // 5. Retornar lead criado
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
