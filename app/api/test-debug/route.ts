import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("=== TESTE DEBUG INICIADO ===")
  console.log("Timestamp:", new Date().toISOString())

  try {
    // Teste 1: Verificar variáveis de ambiente
    console.log("TESTE 1: Verificando variáveis de ambiente...")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log(
      "NEXT_PUBLIC_SUPABASE_URL:",
      supabaseUrl ? `Definida: ${supabaseUrl.substring(0, 30)}...` : "NÃO DEFINIDA",
    )
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey ? "Definida (oculta)" : "NÃO DEFINIDA")

    // Teste 2: Verificar se conseguimos importar o Supabase
    console.log("TESTE 2: Tentando importar cliente Supabase...")
    const { db } = await import("@/lib/supabase")
    console.log("Cliente Supabase importado:", db ? "Sucesso" : "Falhou")

    // Teste 3: Teste simples de consulta (sem depender de tabelas específicas)
    console.log("TESTE 3: Tentando consulta simples...")
    if (db) {
      // Vamos tentar uma consulta que deve funcionar em qualquer Supabase
      const { data, error } = await db.rpc("version") // Função built-in do PostgreSQL
      console.log("Resultado da consulta version():", { data, error })
    }

    const result = {
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: supabaseUrl ? "Definida" : "Não definida",
        supabaseKey: supabaseKey ? "Definida" : "Não definida",
      },
      supabaseClient: db ? "Disponível" : "Não disponível",
      message: "Teste de debug concluído com sucesso",
    }

    console.log("RESULTADO FINAL:", JSON.stringify(result, null, 2))
    console.log("=== TESTE DEBUG FINALIZADO ===")

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("ERRO NO TESTE DEBUG:", error)
    console.error("Stack trace:", error.stack)

    return NextResponse.json(
      {
        error: "Erro no teste de debug",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
