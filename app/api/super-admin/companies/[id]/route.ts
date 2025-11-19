import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET - Buscar empresa específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    });

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data });
  } catch (error: any) {
    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar empresa" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar empresa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    });

    const { data, error } = await supabase
      .from("companies")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data });
  } catch (error: any) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar empresa" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar empresa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    });

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao deletar empresa:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao deletar empresa" },
      { status: 500 }
    );
  }
}
