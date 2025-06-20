import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    const { data, error } = await supabase
      .from("user_api_keys")
      .select(`
        id,
        user_id,
        name,
        api_key,
        description,
        is_active,
        last_used_at,
        created_at,
        user_profiles!inner(
          full_name,
          email,
          role
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching API keys:", error)
      return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("❌ API Route Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, name, description } = await request.json()

    if (!userId || !name?.trim()) {
      return NextResponse.json({ error: "User ID and key name are required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    // Gerar API Key
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let newApiKey = "impaai_"
    for (let i = 0; i < 32; i++) {
      newApiKey += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const { error } = await supabase.from("user_api_keys").insert({
      user_id: userId,
      name: name.trim(),
      api_key: newApiKey,
      description: description?.trim() || "API Key para integração com sistemas externos",
      permissions: ["read"],
      rate_limit: 100,
      is_active: true,
      is_admin_key: false,
      access_scope: "user",
      allowed_ips: [],
      usage_count: 0,
    })

    if (error) {
      console.error("❌ Error creating API key:", error)
      return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
    }

    return NextResponse.json({ message: "API Key created successfully" }, { status: 201 })
  } catch (error: any) {
    console.error("❌ API Route Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
