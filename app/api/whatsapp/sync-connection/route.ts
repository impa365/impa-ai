import { type NextRequest, NextResponse } from "next/server";
import { getCurrentServerUser } from "@/lib/auth-server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getCurrentServerUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: "connectionId é obrigatório" },
        { status: 400 }
      );
    }

    console.log(`🔄 [SYNC-API] Sincronizando conexão ${connectionId} para usuário ${user.email}`);

    // Configuração segura do Supabase (server-side)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    });

    // Verificar se a conexão pertence ao usuário (segurança)
    const { data: connection, error: findError } = await supabase
      .from("whatsapp_connections")
      .select("id, user_id")
      .eq("id", connectionId)
      .single();

    if (findError || !connection) {
      console.error("[SYNC-API] Conexão não encontrada:", findError);
      return NextResponse.json(
        { success: false, error: "Conexão não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão (admin ou dono da conexão)
    if (user.role !== "admin" && connection.user_id !== user.id) {
      console.error("[SYNC-API] Usuário não autorizado para esta conexão");
      return NextResponse.json(
        { success: false, error: "Não autorizado para esta conexão" },
        { status: 403 }
      );
    }

    // Tentar usar função RPC primeiro
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("update_connection_sync", {
        connection_id: connectionId,
      });

      if (!rpcError) {
        console.log("[SYNC-API] RPC executado com sucesso:", rpcData);
        return NextResponse.json({
          success: true,
          updated: true,
          method: "rpc",
          data: rpcData,
        });
      }

      console.warn("[SYNC-API] RPC falhou, usando fallback:", rpcError);
    } catch (rpcError) {
      console.warn("[SYNC-API] RPC não disponível, usando fallback");
    }

    // Fallback: atualizar diretamente com timestamp
    const currentTime = new Date().toISOString();
    const { data: updateData, error: updateError } = await supabase
      .from("whatsapp_connections")
      .update({
        updated_at: currentTime,
      })
      .eq("id", connectionId)
      .select();

    if (updateError) {
      console.error("[SYNC-API] Erro no fallback SQL:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    console.log("[SYNC-API] Fallback executado com sucesso");
    return NextResponse.json({
      success: true,
      updated: true,
      method: "fallback",
      data: updateData,
    });

  } catch (error) {
    console.error("[SYNC-API] Erro interno:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro interno do servidor" 
      },
      { status: 500 }
    );
  }
} 