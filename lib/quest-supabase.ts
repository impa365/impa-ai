/**
 * Helper para fazer requisições ao Supabase no schema impaai
 * Todas as tabelas do Quest System estão em impaai.user_quest_progress
 */

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!

/**
 * Headers padrão para requisições ao schema impaai
 */
function getSupabaseHeaders(method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET') {
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Accept-Profile': 'impaai',
    'Content-Profile': 'impaai'
  }

  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json'
    headers['Prefer'] = 'return=representation'
  }

  return headers
}

/**
 * Buscar dados do Supabase (GET)
 */
export async function supabaseGet(table: string, query: string = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`
  
  const response = await fetch(url, {
    headers: getSupabaseHeaders('GET')
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Supabase GET error: ${error}`)
  }

  return response.json()
}

/**
 * Criar dados no Supabase (POST)
 */
export async function supabasePost(table: string, data: any) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders('POST'),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Supabase POST error: ${error}`)
  }

  return response.json()
}

/**
 * Atualizar dados no Supabase (PATCH)
 */
export async function supabasePatch(table: string, query: string, data: any) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getSupabaseHeaders('PATCH'),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Supabase PATCH error: ${error}`)
  }

  return response.json()
}

/**
 * Deletar dados no Supabase (DELETE)
 */
export async function supabaseDelete(table: string, query: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getSupabaseHeaders('DELETE')
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Supabase DELETE error: ${error}`)
  }

  return response.json()
}

