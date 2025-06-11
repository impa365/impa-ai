import { supabase } from "./supabase" // Importa o cliente Supabase já inicializado

export async function checkDatabaseHealth(): Promise<{
  canConnect: boolean
  essentialTablesExist: boolean
  message: string
  details?: any
}> {
  try {
    // Tenta uma consulta simples para verificar a conexão
    const { error: connectionError } = await supabase.from("user_profiles").select("id").limit(1) // Usando uma tabela que deve existir

    if (connectionError) {
      // Verifica se o erro é de conexão ou tabela não encontrada
      if (
        connectionError.message.toLowerCase().includes("fetch failed") ||
        connectionError.message.toLowerCase().includes("connection refused") ||
        connectionError.message.toLowerCase().includes("network error")
      ) {
        console.error("System Check: Database connection failed.", connectionError)
        return {
          canConnect: false,
          essentialTablesExist: false,
          message: `Failed to connect to the database. Ensure Supabase URL is correct and reachable. Details: ${connectionError.message}`,
          details: connectionError,
        }
      }
      // Se não for erro de conexão, pode ser tabela não encontrada ou outro problema de query
      console.warn("System Check: Query failed, might indicate table issue or other DB problem.", connectionError)
      // Não podemos confirmar tabelas se a query básica falha por outro motivo que não seja conexão
      // Vamos assumir que a conexão é "parcialmente" ok, mas as tabelas podem não estar.
    }

    // Se chegou aqui, a conexão básica (pelo menos a URL/chave) parece OK.
    // Agora, verifique tabelas essenciais.
    const essentialTables = ["system_settings", "system_themes", "user_profiles", "ai_agents"]
    for (const tableName of essentialTables) {
      const { error: tableError } = await supabase.from(tableName).select("id", { count: "exact", head: true })
      if (tableError) {
        console.error(`System Check: Essential table '${tableName}' missing or query failed.`, tableError)
        return {
          canConnect: true, // Conexão básica pode estar ok
          essentialTablesExist: false,
          message: `Essential table '${tableName}' is missing or inaccessible. Please ensure your database schema is correctly set up. Details: ${tableError.message}`,
          details: tableError,
        }
      }
    }

    console.log("System Check: Database connection and essential tables OK.")
    return { canConnect: true, essentialTablesExist: true, message: "Database health check passed." }
  } catch (e: any) {
    // Erro na própria lógica de getSupabaseClient() (ex: URL malformada antes da tentativa de fetch)
    console.error("System Check: Unexpected error during database health check setup.", e)
    return {
      canConnect: false,
      essentialTablesExist: false,
      message: `Critical error during database health check setup: ${e.message}. This often means environment variables for Supabase are missing or malformed.`,
      details: e,
    }
  }
}
