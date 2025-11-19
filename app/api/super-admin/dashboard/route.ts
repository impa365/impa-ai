// ================================================
// API Route: /api/super-admin/dashboard
// Dashboard completo para Super Admin
// ================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

// GET /api/super-admin/dashboard - Dashboard do Super Admin
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    });
    
    // Buscar totais
    const { count: totalCompanies } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true });

    const { count: activeCompanies } = await supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: totalUsers } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalAgents } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true });

    const { count: totalConnections } = await supabase
      .from("whatsapp_connections")
      .select("*", { count: "exact", head: true });

    const { count: totalIntegrations } = await supabase
      .from("integrations")
      .select("*", { count: "exact", head: true });
    
    // Montar resposta
    return NextResponse.json({
      totalCompanies: totalCompanies || 0,
      activeCompanies: activeCompanies || 0,
      totalUsers: totalUsers || 0,
      totalAgents: totalAgents || 0,
      totalConnections: totalConnections || 0,
      totalIntegrations: totalIntegrations || 0,
    });
  } catch (error) {
    console.error('Error fetching super admin dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  }
}
