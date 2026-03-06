import { type NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

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

    // 2. Buscar a conexão pelo instance_name e instance_token
    const connection = await queryOne(
      `SELECT * FROM whatsapp_connections WHERE instance_name = $1 AND instance_token = $2`,
      [instance_name, instance_token]
    );
    if (!connection) {
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        error: "Conexão não encontrada",
        details: isDev ? "No matching connection found" : undefined,
        supabase: isDev ? { instance_name, instance_token } : undefined
      }, { status: 404 });
    }

    // 3. Retornar todos os dados da conexão
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