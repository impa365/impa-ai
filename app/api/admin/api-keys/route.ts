import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    console.log("🔍 Starting API keys fetch...")

    const user = getCurrentUser()
    console.log("👤 Current user:", user ? `${user.email} (${user.role})` : "null")

    if (!user || user.role !== "admin") {
      console.log("❌ Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("🔑 Environment check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0,
    })

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Import Supabase dynamically to avoid issues
    const { createClient } = await import("@supabase/supabase-js")

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("📊 Supabase client created, fetching API keys...")

    // First, try a simple query without joins
    const { data: apiKeysData, error: apiKeysError } = await supabase
      .from("user_api_keys")
      .select("*")
      .order("created_at", { ascending: false })

    if (apiKeysError) {
      console.error("❌ Error fetching API keys:", apiKeysError)
      return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
    }

    console.log("✅ API keys fetched:", apiKeysData?.length || 0)

    // If we have API keys, fetch user profiles separately
    if (apiKeysData && apiKeysData.length > 0) {
      const userIds = [...new Set(apiKeysData.map((key) => key.user_id))]
      console.log("👥 Fetching user profiles for IDs:", userIds.length)

      const { data: usersData, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, role")
        .in("id", userIds)

      if (usersError) {
        console.error("❌ Error fetching users:", usersError)
        // Continue without user data rather than failing completely
      }

      console.log("✅ User profiles fetched:", usersData?.length || 0)

      // Combine the data
      const combinedData = apiKeysData.map((apiKey) => ({
        ...apiKey,
        user_profiles: usersData?.find((user) => user.id === apiKey.user_id) || null,
      }))

      console.log("🔄 Data combined successfully")
      return NextResponse.json(combinedData)
    }

    console.log("📝 No API keys found, returning empty array")
    return NextResponse.json([])
  } catch (error) {
    console.error("❌ Unexpected error in API keys route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("➕ Starting API key creation...")

    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, name, description } = body

    console.log("📝 Create API key request:", { user_id, name, hasDescription: !!description })

    if (!user_id || !name) {
      return NextResponse.json({ error: "User ID and name are required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Generate API key
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let apiKey = "impaai_"
    for (let i = 0; i < 32; i++) {
      apiKey += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    console.log("🔑 Generated API key:", `${apiKey.substring(0, 15)}...`)

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

    console.log("✅ API key created successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error in create API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
