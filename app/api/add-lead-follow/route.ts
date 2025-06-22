import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        {
          error: "Invalid or missing API key",
          details: authResult.error,
        },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Obter dados do header e body
    const instanceName = request.headers.get("instance_name");
    const userIdHeader = request.headers.get("user_id");

    if (!instanceName) {
      return NextResponse.json(
        {
          error: "Missing required header",
          details: "instance_name header is required",
        },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid JSON body",
          details: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const { remoteJid, name, dia } = body;

    // Validações mais específicas
    if (!remoteJid) {
      return NextResponse.json(
        {
          error: "Missing required field",
          details: "remoteJid is required",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: "Missing required field",
          details: "name is required",
        },
        { status: 400 }
      );
    }

    if (dia === undefined || dia === null) {
      return NextResponse.json(
        {
          error: "Missing required field",
          details: "dia is required",
        },
        { status: 400 }
      );
    }

    // Validar que dia é um número válido (1-30)
    const dayNumber = Number.parseInt(dia.toString());
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json(
        {
          error: "Invalid field value",
          details: "dia must be a number between 1 and 30",
        },
        { status: 400 }
      );
    }

    // Validar formato do remoteJid (deve ser um número)
    if (!/^\d+$/.test(remoteJid)) {
      return NextResponse.json(
        {
          error: "Invalid field format",
          details: "remoteJid must contain only numbers",
        },
        { status: 400 }
      );
    }

    // Determinar user_id (admin pode especificar, usuário comum usa o próprio)
    let targetUserId = user.id;
    if (user.role === "admin" && userIdHeader) {
      targetUserId = userIdHeader;
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    });

    // Verificar se o lead já existe
    const { data: existingLead, error: selectError } = await supabase
      .from("lead_follow24hs")
      .select("id, is_active")
      .eq("user_id", targetUserId)
      .eq("instance_name", instanceName)
      .eq("remote_jid", remoteJid)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error checking existing lead:", selectError);
      return NextResponse.json(
        {
          error: "Database error",
          details: "Failed to check existing lead",
        },
        { status: 500 }
      );
    }

    if (existingLead) {
      if (existingLead.is_active) {
        return NextResponse.json(
          {
            error: "Lead already exists",
            details: "Lead already exists and is active for this instance",
          },
          { status: 409 }
        );
      } else {
        // Reativar lead existente
        const { data: updatedLead, error: updateError } = await supabase
          .from("lead_follow24hs")
          .update({
            name,
            start_date: new Date().toISOString().split("T")[0],
            current_day: dayNumber,
            is_active: true,
            last_message_sent_day: 0,
            last_message_sent_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLead.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error reactivating lead:", updateError);
          return NextResponse.json(
            {
              error: "Database error",
              details: "Failed to reactivate lead",
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Lead reactivated successfully",
          data: updatedLead,
        });
      }
    }

    // Criar novo lead
    const { data: newLead, error: insertError } = await supabase
      .from("lead_follow24hs")
      .insert({
        user_id: targetUserId,
        instance_name: instanceName,
        remote_jid: remoteJid,
        name,
        start_date: new Date().toISOString().split("T")[0],
        current_day: dayNumber,
        is_active: true,
        last_message_sent_day: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating lead:", insertError);
      return NextResponse.json(
        {
          error: "Database error",
          details: "Failed to create lead: " + insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead added successfully",
      data: newLead,
    });
  } catch (error) {
    console.error("Error in add-lead-follow:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
