import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// GET - Listar usuários da empresa
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

    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("company_id", params.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

// POST - Criar usuário na empresa
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { email, password, full_name, role, phone, can_create_users, can_manage_company } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, senha e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    });

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        email,
        password: hashedPassword,
        full_name,
        role: role || "user",
        phone,
        company_id: params.id,
        can_create_users: can_create_users || false,
        can_manage_company: can_manage_company || false,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    });

    // Se tiver senha, fazer hash
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error: any) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    });

    const { error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao deletar usuário" },
      { status: 500 }
    );
  }
}
