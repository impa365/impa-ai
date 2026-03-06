/**
 * PostgreSQL Direct Connection Module
 * Replaces all Supabase client usage with direct PostgreSQL queries
 * 
 * All tables are in the "impaai" schema.
 * Uses the `pg` library with connection pooling.
 * 
 * Environment variables:
 *   DATABASE_URL - Full connection string (preferred)
 *   -- OR individual variables --
 *   PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE
 */

import { Pool, type PoolClient } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (connectionString) {
      pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    } else {
      pool = new Pool({
        host: process.env.PG_HOST || "localhost",
        port: parseInt(process.env.PG_PORT || "5432"),
        user: process.env.PG_USER || "postgres",
        password: process.env.PG_PASSWORD || "",
        database: process.env.PG_DATABASE || "postgres",
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }

    // Set search_path to impaai schema on every new connection
    pool.on("connect", (client: PoolClient) => {
      client.query("SET search_path TO impaai, public");
    });

    pool.on("error", (err: Error) => {
      console.error("❌ [DB Pool] Unexpected error on idle client:", err.message);
    });
  }

  return pool;
}

/**
 * Execute a raw SQL query with parameterized values
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount || 0 };
  } finally {
    client.release();
  }
}

/**
 * Execute a query and return only the first row (or null)
 */
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const { rows } = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Execute a query and return all rows
 */
export async function queryMany<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const { rows } = await query<T>(text, params);
  return rows;
}

/**
 * Execute a query with a timeout (in ms)
 */
export async function queryWithTimeout<T = any>(
  text: string,
  params?: any[],
  timeoutMs: number = 5000
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await getPool().connect();
  try {
    await client.query(`SET statement_timeout = ${timeoutMs}`);
    const result = await client.query(text, params);
    await client.query("RESET statement_timeout");
    return { rows: result.rows as T[], rowCount: result.rowCount || 0 };
  } finally {
    client.release();
  }
}

/**
 * Execute an RPC/function call
 */
export async function rpc<T = any>(
  functionName: string,
  params?: Record<string, any>
): Promise<T> {
  const paramEntries = params ? Object.entries(params) : [];
  const paramPlaceholders = paramEntries.map((_, i) => `$${i + 1}`).join(", ");
  const paramNames = paramEntries.map(([k]) => k).join(", ");
  
  let sql: string;
  if (paramEntries.length > 0) {
    // Named parameters: SELECT function(param1 := $1, param2 := $2)
    const namedParams = paramEntries
      .map(([k], i) => `${k} := $${i + 1}`)
      .join(", ");
    sql = `SELECT impaai.${functionName}(${namedParams}) as result`;
  } else {
    sql = `SELECT impaai.${functionName}() as result`;
  }

  const values = paramEntries.map(([, v]) => v);
  const row = await queryOne<{ result: T }>(sql, values);
  return row?.result as T;
}

/**
 * Get a client from the pool for transaction support
 */
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Helper to build INSERT SQL from an object
 */
export function buildInsert(
  table: string,
  data: Record<string, any>
): { text: string; values: any[] } {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  const columns = keys.map((k) => `"${k}"`).join(", ");

  return {
    text: `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values,
  };
}

/**
 * Helper to build UPDATE SQL from an object with conditions
 */
export function buildUpdate(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>
): { text: string; values: any[] } {
  const dataKeys = Object.keys(data);
  const whereKeys = Object.keys(where);
  const values: any[] = [];

  let paramIndex = 1;
  const setClauses = dataKeys.map((k) => {
    values.push(data[k]);
    return `"${k}" = $${paramIndex++}`;
  });

  const whereClauses = whereKeys.map((k) => {
    values.push(where[k]);
    return `"${k}" = $${paramIndex++}`;
  });

  return {
    text: `UPDATE ${table} SET ${setClauses.join(", ")} WHERE ${whereClauses.join(" AND ")} RETURNING *`,
    values,
  };
}

/**
 * Close the pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default getPool;
