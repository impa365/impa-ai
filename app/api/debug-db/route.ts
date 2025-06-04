import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Testar conexão com o banco
    const { data: connectionTest, error: connectionError } = await supabase.from("ai_agents").select("id").limit(1)

    if (connectionError) {
      return NextResponse.json(
        {
          success: false,
          message: "Erro na conexão com o banco de dados",
          error: connectionError,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15) + "..." || "não definido",
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        { status: 500 },
      )
    }

    // Verificar estrutura da tabela
    const { data: columns, error: columnsError } = await supabase.rpc("get_table_columns", { table_name: "ai_agents" })

    // Alternativa se a função RPC não existir
    const { data: schemaColumns, error: schemaError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "ai_agents")

    return NextResponse.json({
      success: true,
      message: "Conexão com o banco de dados estabelecida com sucesso",
      connectionTest: !!connectionTest,
      columns: columns || schemaColumns || [],
      hasVectorStoreColumns: (columns || schemaColumns || []).some(
        (col: any) => col.column_name === "chatnode_integration" || col.column_name === "orimon_integration",
      ),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao verificar conexão com o banco de dados",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
