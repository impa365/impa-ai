import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { remoteJid, instance_name, dia, name } = body;

    if (!remoteJid || !instance_name) {
      return NextResponse.json({ error: "remoteJid e instance_name são obrigatórios" }, { status: 400 });
    }

    if (dia === undefined) {
      return NextResponse.json({ error: "dia é obrigatório" }, { status: 400 });
    }

    const dayNumber = Number.parseInt(dia.toString());
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json({ error: "dia deve ser um número entre 1 e 30" }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    });

    // Buscar lead
    const { data: lead, error: findError } = await supabase
      .from("lead_folow24hs")
      .select("*")
      .eq("remoteJid", remoteJid)
      .eq("instance_name", instance_name)
      .single();

    if (findError || !lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }

    // Atualizar lead
    const updateData: any = { dia: dayNumber, updated_at: new Date().toISOString() };
    if (name) updateData.name = name;

    const { data: updatedLead, error: updateError } = await supabase
      .from("lead_folow24hs")
      .update(updateData)
      .eq("id", lead.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Lead atualizado com sucesso",
      data: updatedLead,
    });
  } catch (error) {
    console.error("Error in update-lead-follow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
