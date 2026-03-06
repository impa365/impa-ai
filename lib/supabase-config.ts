/**
 * Database Configuration - MIGRATED from Supabase to PostgreSQL Direct
 * 
 * This file provides backward compatibility for code that imports
 * getSupabaseServer(). All database access now goes through lib/db.ts
 * using direct PostgreSQL connections.
 * 
 * For new code, import directly from lib/db.ts:
 *   import { query, queryOne, queryMany } from "@/lib/db"
 */

import { query, queryOne, queryMany, buildInsert, buildUpdate } from "./db";

/**
 * Returns a compatibility client that translates Supabase-style
 * chained queries into direct PostgreSQL SQL.
 * 
 * @deprecated Use imports from lib/db.ts directly for new code
 */
export function getSupabaseServer() {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseServer should only be used on the server side");
  }
  return createCompatClient();
}

function createCompatClient() {
  return {
    from: (table: string) => new CompatQueryBuilder(table),
    rpc: async (fnName: string, params?: Record<string, any>) => {
      try {
        const { rpc } = await import("./db");
        const result = await rpc(fnName, params);
        return { data: result, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    },
  };
}

class CompatQueryBuilder {
  private table: string;
  private selectCols: string = "*";
  private conditions: { col: string; op: string; val: any }[] = [];
  private orFilter: string | null = null;
  private orderByCols: { col: string; asc: boolean }[] = [];
  private limitCount: number | null = null;
  private _isCount: boolean = false;
  private _isHead: boolean = false;
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private insertData: any = null;
  private updateData: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = "*", options?: { count?: string; head?: boolean }) {
    this.selectCols = columns;
    this.operation = "select";
    if (options?.count === "exact") this._isCount = true;
    if (options?.head) this._isHead = true;
    return this;
  }

  insert(data: any) {
    this.operation = "insert";
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data: any) {
    this.operation = "update";
    this.updateData = data;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: any) {
    this.conditions.push({ col: column, op: "=", val: value });
    return this;
  }

  neq(column: string, value: any) {
    this.conditions.push({ col: column, op: "!=", val: value });
    return this;
  }

  gt(column: string, value: any) {
    this.conditions.push({ col: column, op: ">", val: value });
    return this;
  }

  gte(column: string, value: any) {
    this.conditions.push({ col: column, op: ">=", val: value });
    return this;
  }

  lt(column: string, value: any) {
    this.conditions.push({ col: column, op: "<", val: value });
    return this;
  }

  lte(column: string, value: any) {
    this.conditions.push({ col: column, op: "<=", val: value });
    return this;
  }

  is(column: string, value: any) {
    if (value === null) {
      this.conditions.push({ col: column, op: "IS NULL", val: null });
    } else {
      this.conditions.push({ col: column, op: "=", val: value });
    }
    return this;
  }

  in(column: string, values: any[]) {
    this.conditions.push({ col: column, op: "IN", val: values });
    return this;
  }

  or(filterStr: string) {
    this.orFilter = filterStr;
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderByCols.push({ col: column, asc: opts?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async single(): Promise<{ data: any; error: any }> {
    const result = await this.execute();
    if (result.error) return result;
    if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
      return { data: null, error: { message: "Row not found", code: "PGRST116" } };
    }
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    return { data: row, error: null };
  }

  async maybeSingle(): Promise<{ data: any; error: any }> {
    const result = await this.execute();
    if (result.error) return result;
    if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
      return { data: null, error: null };
    }
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    return { data: row, error: null };
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (error) {
      if (reject) reject(error);
    }
  }

  private buildWhere(startIndex: number = 1): { sql: string; params: any[]; nextIndex: number } {
    const parts: string[] = [];
    const params: any[] = [];
    let idx = startIndex;

    for (const cond of this.conditions) {
      if (cond.op === "IS NULL") {
        parts.push(`"${cond.col}" IS NULL`);
      } else if (cond.op === "IN") {
        const placeholders = (cond.val as any[]).map(() => `$${idx++}`).join(", ");
        parts.push(`"${cond.col}" IN (${placeholders})`);
        params.push(...cond.val);
      } else {
        parts.push(`"${cond.col}" ${cond.op} $${idx++}`);
        params.push(cond.val);
      }
    }

    if (this.orFilter) {
      const orParts = this.orFilter.split(",").map((part) => {
        const match = part.trim().match(/^(\w+)\.(eq|neq|gt|gte|lt|lte|is)\.(.+)$/);
        if (match) {
          const [, col, op, val] = match;
          const pgOp: Record<string, string> = { eq: "=", neq: "!=", gt: ">", gte: ">=", lt: "<", lte: "<=", is: "IS" };
          if (pgOp[op] === "IS" && val === "null") {
            return `"${col}" IS NULL`;
          }
          params.push(val);
          return `"${col}" ${pgOp[op] || "="} $${idx++}`;
        }
        return "TRUE";
      });
      parts.push(`(${orParts.join(" OR ")})`);
    }

    const sql = parts.length > 0 ? `WHERE ${parts.join(" AND ")}` : "";
    return { sql, params, nextIndex: idx };
  }

  private buildOrderBy(): string {
    if (this.orderByCols.length === 0) return "";
    const parts = this.orderByCols.map(
      (o) => `"${o.col}" ${o.asc ? "ASC" : "DESC"}`
    );
    return `ORDER BY ${parts.join(", ")}`;
  }

  private buildLimit(): string {
    if (this.limitCount === null) return "";
    return `LIMIT ${this.limitCount}`;
  }

  async execute(): Promise<{ data: any; error: any; count?: number }> {
    try {
      switch (this.operation) {
        case "select": {
          if (this._isCount && this._isHead) {
            const { sql: whereSql, params } = this.buildWhere();
            const countSql = `SELECT COUNT(*) as count FROM ${this.table} ${whereSql}`;
            const result = await queryOne<{ count: string }>(countSql, params);
            const count = parseInt(result?.count || "0");
            return { data: null, error: null, count };
          }

          const cols = this.selectCols === "*" ? "*" : this.selectCols
            .split(",")
            .map((c) => c.trim())
            .filter((c) => !c.includes("(") && !c.includes("!"))
            .map((c) => {
              c = c.trim();
              if (c === "*") return "*";
              if (c.includes('"')) return c;
              return `"${c}"`;
            })
            .join(", ") || "*";

          const { sql: whereSql, params } = this.buildWhere();
          const orderBy = this.buildOrderBy();
          const limit = this.buildLimit();

          const sql = `SELECT ${cols} FROM ${this.table} ${whereSql} ${orderBy} ${limit}`;
          const rows = await queryMany(sql, params);
          return { data: rows, error: null };
        }

        case "insert": {
          if (!this.insertData || this.insertData.length === 0) {
            return { data: null, error: { message: "No data to insert" } };
          }

          const results: any[] = [];
          for (const row of this.insertData) {
            const { text, values } = buildInsert(this.table, row);
            const insertedRows = await queryMany(text, values);
            results.push(...insertedRows);
          }
          return { data: results, error: null };
        }

        case "update": {
          if (!this.updateData) {
            return { data: null, error: { message: "No data to update" } };
          }

          const dataKeys = Object.keys(this.updateData);
          const values: any[] = [];
          let idx = 1;

          const setClauses = dataKeys.map((k) => {
            values.push(this.updateData[k]);
            return `"${k}" = $${idx++}`;
          });

          const { sql: whereSql, params: whereParams } = this.buildWhere(idx);
          values.push(...whereParams);

          const sql = `UPDATE ${this.table} SET ${setClauses.join(", ")} ${whereSql} RETURNING *`;
          const rows = await queryMany(sql, values);
          return { data: rows, error: null };
        }

        case "delete": {
          const { sql: whereSql, params } = this.buildWhere();
          const sql = `DELETE FROM ${this.table} ${whereSql} RETURNING *`;
          const rows = await queryMany(sql, params);
          return { data: rows, error: null };
        }

        default:
          return { data: null, error: { message: "Unknown operation" } };
      }
    } catch (error: any) {
      console.error(`❌ [DB Compat] Error in ${this.operation} on ${this.table}:`, error.message);
      return { data: null, error: { message: error.message, code: error.code } };
    }
  }
}

// Função para resetar a instância (no-op for compatibility)
export function resetSupabaseInstance() {
  // No-op
}

// Configurações padrão
export const supabaseConfig = {
  schema: "impaai",
  storageKey: "impaai-auth-token",
};
