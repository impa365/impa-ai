import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("🔍 [API Keys] Starting fetch...")

    const user = getCurrentUser()
    console.log("👤 [API Keys] Current user:", user ? `${user.email} (${user.role})` : "null")

    if (!user || user.role !== "admin") {
      console.log("❌ [API Keys] Unauthorized access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    console.log("🔑 [API Keys] Environment check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    })

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [API Keys] Missing environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

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
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, name, description } = body

    if (!user_id || !name) {
      return NextResponse.json({ error: "User ID and name are required" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate API key
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let apiKey = "impaai_"
    for (let i = 0; i < 32; i++) {
      apiKey += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const { error } = await supabase.from("user_api_keys").insert({
      user_id,
      name: name.trim(),
      api_key: apiKey,
      description: description?.trim() || "API Key para integração com sistemas externos",
      permissions: ["read"],
      rate_limit: 100,
      is_active: true,
      is_admin_key: false,
      access_scope: "user",
    })

    if (error) {
      console.error("❌ Error creating API key:", error)
      return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error in create API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
