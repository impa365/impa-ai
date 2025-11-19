import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET - Listar todas as empresas
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    });

    const { data: companies, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar empresas:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ companies: companies || [] });
  } catch (error: any) {
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar empresas" },
      { status: 500 }
    );
  }
}

// POST - Criar nova empresa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      document,
      address,
      city,
      state,
      country,
      zip_code,
      max_users,
      max_agents,
      max_connections,
      max_integrations,
      max_monthly_messages,
      status,
      subscription_plan,
      subscription_expires_at,
      logo_url,
      primary_color,
      secondary_color,
      settings,
      metadata,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    });

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name,
        email,
        phone,
        document,
        address,
        city,
        state,
        country,
        zip_code,
        max_users: max_users || 10,
        max_agents: max_agents || 20,
        max_connections: max_connections || 10,
        max_integrations: max_integrations || 5,
        max_monthly_messages: max_monthly_messages || 10000,
        status: status || "active",
        subscription_plan: subscription_plan || "basic",
        subscription_expires_at,
        logo_url,
        primary_color,
        secondary_color,
        settings: settings || {},
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar empresa:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data });
  } catch (error: any) {
    console.error("Erro ao criar empresa:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar empresa" },
      { status: 500 }
    );
  }
}
