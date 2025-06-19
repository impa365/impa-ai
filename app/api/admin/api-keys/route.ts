import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

// Create admin Supabase client with available environment variables
function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  console.log("🔑 [API Keys] Environment variables check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseKey?.length || 0,
  })

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET() {
  try {
    console.log("🔍 [API Keys] Starting fetch...")

    const user = getCurrentUser()
    console.log("👤 [API Keys] Current user:", user ? `${user.email} (${user.role})` : "null")

    if (!user || user.role !== "admin") {
      console.log("❌ [API Keys] Unauthorized access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminSupabaseClient()

    console.log("📊 [API Keys] Fetching from user_api_keys table...")

    // First, get API keys with detailed logging
    const { data: apiKeysData, error: apiKeysError } = await supabase
      .from("user_api_keys")
      .select("*")
      .order("created_at", { ascending: false })

    console.log("📋 [API Keys] Raw query result:", {
      success: !apiKeysError,
      error: apiKeysError,
      dataCount: apiKeysData?.length || 0,
      firstItem: apiKeysData?.[0]
        ? {
            id: apiKeysData[0].id,
            name: apiKeysData[0].name,
            user_id: apiKeysData[0].user_id,
            is_active: apiKeysData[0].is_active,
          }
        : null,
    })

    if (apiKeysError) {
      console.error("❌ [API Keys] Error fetching API keys:", apiKeysError)
      return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
    }

    if (!apiKeysData || apiKeysData.length === 0) {
      console.log("📝 [API Keys] No API keys found in database")
      return NextResponse.json([])
    }

    // Get unique user IDs
    const userIds = [...new Set(apiKeysData.map((key) => key.user_id))]
    console.log("👥 [API Keys] Fetching user profiles for IDs:", userIds)

    const { data: usersData, error: usersError } = await supabase
      .from("user_profiles")
      .select("id, full_name, email, role")
      .in("id", userIds)

    console.log("👤 [API Keys] User profiles result:", {
      success: !usersError,
      error: usersError,
      userCount: usersData?.length || 0,
      users: usersData?.map((u) => ({ id: u.id, email: u.email, role: u.role })) || [],
    })

    if (usersError) {
      console.error("❌ [API Keys] Error fetching users:", usersError)
      // Continue without user data rather than failing
    }

    // Combine the data
    const combinedData = apiKeysData.map((apiKey) => {
      const userProfile = usersData?.find((user) => user.id === apiKey.user_id) || null
      console.log(`🔗 [API Keys] Combining data for key ${apiKey.name}:`, {
        keyId: apiKey.id,
        userId: apiKey.user_id,
        foundUser: !!userProfile,
        userEmail: userProfile?.email || "not found",
      })

      return {
        ...apiKey,
        user_profiles: userProfile,
      }
    })

    console.log("✅ [API Keys] Final combined data:", {
      totalKeys: combinedData.length,
      keysWithUsers: combinedData.filter((k) => k.user_profiles).length,
      keysWithoutUsers: combinedData.filter((k) => !k.user_profiles).length,
    })

    return NextResponse.json(combinedData)
  } catch (error) {
    console.error("❌ [API Keys] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("➕ [API Keys] Starting creation...")

    const user = getCurrentUser()
    console.log("👤 [API Keys] Current user:", user ? `${user.email} (${user.role})` : "null")

    if (!user || user.role !== "admin") {
      console.log("❌ [API Keys] Unauthorized access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, name, description } = body

    console.log("📝 [API Keys] Create request:", { user_id, name, hasDescription: !!description })

    if (!user_id || !name) {
      console.log("❌ [API Keys] Missing required fields")
      return NextResponse.json({ error: "User ID and name are required" }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Generate API key
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let apiKey = "impaai_"
    for (let i = 0; i < 32; i++) {
      apiKey += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    console.log("🔑 [API Keys] Generated API key:", `${apiKey.substring(0, 15)}...`)

    // Prepare insert data
    const insertData = {
      user_id,
      name: name.trim(),
      api_key: apiKey,
      description: description?.trim() || "API Key para integração com sistemas externos",
      permissions: ["read"],
      rate_limit: 100,
      is_active: true,
      is_admin_key: false,
      access_scope: "user",
      allowed_ips: [],
      usage_count: 0,
    }

    console.log("💾 [API Keys] Insert data:", {
      ...insertData,
      api_key: `${insertData.api_key.substring(0, 15)}...`,
    })

    const { data, error } = await supabase.from("user_api_keys").insert(insertData).select()

    if (error) {
      console.error("❌ [API Keys] Error creating API key:", error)
      console.error("❌ [API Keys] Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })

      // If it's an RLS error, try to provide more context
      if (error.message?.includes("row-level security")) {
        console.error("❌ [API Keys] RLS Policy violation - admin user may need different permissions")
        return NextResponse.json(
          {
            error: "Permission denied - Row Level Security policy violation",
            details: "Admin user may not have permission to create API keys",
          },
          { status: 403 },
        )
      }

      return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
    }

    console.log("✅ [API Keys] API key created successfully:", data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ [API Keys] Unexpected error in creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
