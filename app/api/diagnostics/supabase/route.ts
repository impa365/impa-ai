import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Starting Supabase diagnostics...")

    const client = await getSupabase()
    const diagnostics: any = {
      connection: null,
      schema: null,
      tables: {},
      errors: [],
    }

    // 1. Testar conexão básica
    try {
      console.log("🔗 Testing basic connection...")
      const { data: connectionTest, error: connectionError } = await client
        .from("information_schema.tables")
        .select("table_name")
        .limit(1)

      if (connectionError) {
        diagnostics.connection = { status: "error", error: connectionError.message }
        diagnostics.errors.push(`Connection error: ${connectionError.message}`)
      } else {
        diagnostics.connection = { status: "success" }
      }
    } catch (error: any) {
      diagnostics.connection = { status: "error", error: error.message }
      diagnostics.errors.push(`Connection exception: ${error.message}`)
    }

    // 2. Verificar se o schema 'impaai' existe
    try {
      console.log("📋 Checking schema 'impaai'...")
      const { data: schemaData, error: schemaError } = await client
        .from("information_schema.schemata")
        .select("schema_name")
        .eq("schema_name", "impaai")

      if (schemaError) {
        diagnostics.schema = { status: "error", error: schemaError.message }
        diagnostics.errors.push(`Schema error: ${schemaError.message}`)
      } else if (schemaData && schemaData.length > 0) {
        diagnostics.schema = { status: "exists" }
      } else {
        diagnostics.schema = { status: "not_found" }
        diagnostics.errors.push("Schema 'impaai' not found")
      }
    } catch (error: any) {
      diagnostics.schema = { status: "error", error: error.message }
      diagnostics.errors.push(`Schema check exception: ${error.message}`)
    }

    // 3. Verificar tabelas específicas
    const tablesToCheck = ["system_themes", "system_settings", "user_profiles", "ai_agents", "whatsapp_connections"]

    for (const tableName of tablesToCheck) {
      try {
        console.log(`🔍 Checking table: ${tableName}`)

        // Tentar acessar a tabela
        const { data, error } = await client.from(tableName).select("*").limit(1)

        if (error) {
          diagnostics.tables[tableName] = {
            status: "error",
            error: error.message,
            code: error.code,
            details: error.details,
          }
          diagnostics.errors.push(`Table ${tableName}: ${error.message}`)
        } else {
          diagnostics.tables[tableName] = {
            status: "accessible",
            rowCount: data ? data.length : 0,
          }
        }
      } catch (error: any) {
        diagnostics.tables[tableName] = {
          status: "exception",
          error: error.message,
        }
        diagnostics.errors.push(`Table ${tableName} exception: ${error.message}`)
      }
    }

    // 4. Verificar RLS (Row Level Security)
    try {
      console.log("🔒 Checking RLS policies...")
      const { data: rlsData, error: rlsError } = await client
        .from("pg_policies")
        .select("schemaname, tablename, policyname")
        .eq("schemaname", "impaai")

      if (rlsError) {
        diagnostics.rls = { status: "error", error: rlsError.message }
      } else {
        diagnostics.rls = {
          status: "checked",
          policies: rlsData || [],
          count: rlsData ? rlsData.length : 0,
        }
      }
    } catch (error: any) {
      diagnostics.rls = { status: "exception", error: error.message }
    }

    console.log("✅ Diagnostics completed:", diagnostics)

    return NextResponse.json({
      success: diagnostics.errors.length === 0,
      timestamp: new Date().toISOString(),
      diagnostics,
    })
  } catch (error: any) {
    console.error("❌ Diagnostics failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
