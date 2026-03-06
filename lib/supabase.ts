/**
 * Database Access Layer - MIGRATED from Supabase to PostgreSQL Direct
 * 
 * All database access now goes through lib/db.ts using direct PostgreSQL.
 * This file provides backward compatibility for existing imports.
 * 
 * For new code, use:
 *   import { query, queryOne, queryMany } from "@/lib/db"
 */

// Re-export interfaces for compatibility
export interface UserProfile {
  id: string
  full_name: string | null
  email: string
  role: "user" | "admin" | "moderator"
  status: "active" | "inactive" | "suspended" | "hibernated"
  organization_id?: string | null
  last_login_at?: string | null
  created_at: string
  updated_at: string
  api_key?: string
  avatar_url?: string
  theme_settings?: any
  preferences?: any
}

// Re-export getSupabaseServer from compat layer
export function getSupabaseServer() {
  if (typeof window !== "undefined") {
    throw new Error("❌ getSupabaseServer should only be used in API routes")
  }
  const { getSupabaseServer: getServerClient } = require("./supabase-config")
  return getServerClient()
}

// Re-export getSupabase (deprecated)
export async function getSupabase() {
  throw new Error("❌ getSupabase() is deprecated. Use lib/db.ts directly.")
}

// Compatibility: supabase object uses the compat client
const { getSupabaseServer: _getServer } = require("./supabase-config")

export const supabase = _getServer()

export const db = {
  users: () => {
    throw new Error("❌ Direct DB access deprecated. Use apiClient.getUsers() instead")
  },
  agents: () => {
    throw new Error("❌ Direct DB access deprecated. Use apiClient.getAgents() instead")
  },
  whatsappConnections: () => {
    throw new Error("❌ Direct DB access deprecated. Use apiClient.getWhatsAppConnections() instead")
  },
  systemSettings: () => {
    throw new Error("❌ Direct DB access deprecated. Use apiClient.getSystemSettings() instead")
  },
  activityLogs: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  userSettings: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  themes: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  integrations: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  vectorStores: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  vectorDocuments: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  apiKeys: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  organizations: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
  dailyMetrics: () => {
    throw new Error("❌ Use API endpoints instead of direct DB access")
  },
}
