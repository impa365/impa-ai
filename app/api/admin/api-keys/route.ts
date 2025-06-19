import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the same environment variables as other working APIs
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // First, get API keys
    const { data: apiKeysData, error: apiKeysError } = await supabase
      .from("user_api_keys")
      .select("*")
      .order("created_at", { ascending: false })

    if (apiKeysError) {
      console.error("❌ Error fetching API keys:", apiKeysError)
      return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
    }

    // If we have API keys, get user profiles
    if (apiKeysData && apiKeysData.length > 0) {
      const userIds = [...new Set(apiKeysData.map((key) => key.user_id))]

      const { data: usersData, error: usersError } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, role")
        .in("id", userIds)

      if (usersError) {
        console.error("❌ Error fetching users:", usersError)
      }

      // Combine the data
      const combinedData = apiKeysData.map((apiKey) => ({
        ...apiKey,
        user_profiles: usersData?.find((user) => user.id === apiKey.user_id) || null,
      }))

      return NextResponse.json(combinedData)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error("❌ Error in API keys route:", error)
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
