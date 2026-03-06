/**
 * Helper para fazer requisições ao PostgreSQL direto no schema impaai
 * Todas as tabelas do Quest System estão em impaai.user_quest_progress
 * 
 * MIGRADO de Supabase REST API para PostgreSQL direto
 */

import { queryMany, queryOne, query } from "./db"

/**
 * Buscar dados do banco (SELECT)
 */
export async function supabaseGet(table: string, queryStr: string = '') {
  // Parse PostgREST-style query params into SQL
  // e.g., "user_id=eq.abc123&select=*" 
  const params: any[] = []
  const conditions: string[] = []
  let selectCols = '*'
  
  if (queryStr) {
    const parts = queryStr.split('&')
    for (const part of parts) {
      if (part.startsWith('select=')) {
        selectCols = part.replace('select=', '')
        continue
      }
      // Handle PostgREST filters: column=eq.value
      const eqMatch = part.match(/^(\w+)=eq\.(.+)$/)
      if (eqMatch) {
        params.push(eqMatch[2])
        conditions.push(`"${eqMatch[1]}" = $${params.length}`)
      }
    }
  }
  
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `SELECT ${selectCols} FROM ${table} ${where}`
  
  return queryMany(sql, params)
}

/**
 * Criar dados no banco (INSERT)
 */
export async function supabasePost(table: string, data: any) {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
  const columns = keys.map(k => `"${k}"`).join(', ')
  
  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`
  return queryMany(sql, values)
}

/**
 * Atualizar dados no banco (UPDATE)
 */
export async function supabasePatch(table: string, queryStr: string, data: any) {
  const dataKeys = Object.keys(data)
  const values: any[] = []
  let idx = 1
  
  const setClauses = dataKeys.map(k => {
    values.push(data[k])
    return `"${k}" = $${idx++}`
  })
  
  // Parse PostgREST-style query
  const conditions: string[] = []
  if (queryStr) {
    const parts = queryStr.split('&')
    for (const part of parts) {
      const eqMatch = part.match(/^(\w+)=eq\.(.+)$/)
      if (eqMatch) {
        values.push(eqMatch[2])
        conditions.push(`"${eqMatch[1]}" = $${idx++}`)
      }
    }
  }
  
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `UPDATE ${table} SET ${setClauses.join(', ')} ${where} RETURNING *`
  
  return queryMany(sql, values)
}

/**
 * Deletar dados no banco (DELETE)
 */
export async function supabaseDelete(table: string, queryStr: string) {
  const params: any[] = []
  const conditions: string[] = []
  let idx = 1
  
  if (queryStr) {
    const parts = queryStr.split('&')
    for (const part of parts) {
      const eqMatch = part.match(/^(\w+)=eq\.(.+)$/)
      if (eqMatch) {
        params.push(eqMatch[2])
        conditions.push(`"${eqMatch[1]}" = $${idx++}`)
      }
    }
  }
  
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `DELETE FROM ${table} ${where} RETURNING *`
  
  return queryMany(sql, params)
}

