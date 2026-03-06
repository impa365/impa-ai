import { type NextRequest, NextResponse } from "next/server";
import { query, queryOne, queryMany, buildInsert } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get("instance_name");

    if (!instanceName) {
      return NextResponse.json(
        { error: "instance_name parameter is required" },
        { status: 400 }
      );
    }

    // Buscar configuração de follow-up
    const config = await queryOne(
      `SELECT * FROM followup_24hs WHERE user_id = $1 AND instance_name = $2`,
      [user.id, instanceName]
    );

    // Se config existe, buscar mensagens relacionadas
    if (config) {
      const messages = await queryMany(
        `SELECT * FROM followup_messages WHERE followup_config_id = $1`,
        [config.id]
      );
      config.followup_messages = messages;
    }

    return NextResponse.json({
      success: true,
      data: config || null,
    });
  } catch (error) {
    console.error("Error in followup-config GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const user = authResult.user;
    const body = await request.json();
    const { instanceName, companyName, messages } = body;

    if (!instanceName) {
      return NextResponse.json(
        { error: "instanceName is required" },
        { status: 400 }
      );
    }

    // Criar ou atualizar configuração de follow-up (upsert)
    const config = await queryOne(
      `INSERT INTO followup_24hs (user_id, instance_name, company_name, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, instance_name) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         is_active = EXCLUDED.is_active,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [user.id, instanceName, companyName, true, new Date().toISOString()]
    );

    if (!config) {
      console.error("Error creating/updating followup config: no row returned");
      return NextResponse.json(
        { error: "Failed to create/update followup configuration" },
        { status: 500 }
      );
    }

    // Se mensagens foram fornecidas, atualizar
    if (messages && Array.isArray(messages)) {
      // Remover mensagens existentes
      await query(
        'DELETE FROM followup_messages WHERE followup_config_id = $1',
        [config.id]
      );

      // Inserir novas mensagens
      if (messages.length > 0) {
        const msgValues: any[] = [];
        const msgPlaceholders: string[] = [];
        messages.forEach((msg: any, i: number) => {
          const offset = i * 6;
          msgPlaceholders.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
          );
          msgValues.push(
            config.id,
            msg.dayNumber,
            msg.messageText,
            msg.mediaUrl || null,
            msg.mediaType || "text",
            true
          );
        });

        await query(
          `INSERT INTO followup_messages (followup_config_id, day_number, message_text, media_url, media_type, is_active)
           VALUES ${msgPlaceholders.join(', ')}`,
          msgValues
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Followup configuration created/updated successfully",
      data: config,
    });
  } catch (error) {
    console.error("Error in followup-config POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
