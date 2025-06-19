// Novo arquivo
import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase"
import { getCurrentUserFromSession } from "@/lib/auth" // Assumindo que você tem uma função para pegar o usuário da sessão

export async function GET() {
  try {
    const user = await getCurrentUserFromSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await getSupabaseServer()

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
      console.error("API Error fetching API keys:", error.message)
      return NextResponse.json({ error: "Failed to fetch API keys", details: error.message }, { status: 500 })
    }

    const transformedKeys =
      data?.map((key: any) => ({
        ...key,
        user_profiles: key.user_profiles,
      })) || []

    return NextResponse.json(transformedKeys)
  } catch (error: any) {
    console.error("API Route Error fetching API keys:", error.message)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserFromSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, name, description } = await request.json()

    if (!userId || !name || !name.trim()) {
      return NextResponse.json({ error: "User ID and key name are required" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()
    const newApiKey = generateApiKeyInternal() // Função auxiliar para gerar a chave

    const { error: insertError } = await supabase.from("user_api_keys").insert({
      user_id: userId,
      name: name.trim(),
      api_key: newApiKey,
      description: description?.trim() || "API Key para integração com sistemas externos",
      permissions: ["read"], // Default permissions
      rate_limit: 100, // Default rate limit
      is_active: true,
      is_admin_key: false,
      access_scope: "user",
    })

    if (insertError) {
      console.error("API Error creating API key:", insertError.message)
      return NextResponse.json({ error: "Failed to create API key", details: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "API Key created successfully" }, { status: 201 })
  } catch (error: any) {
    console.error("API Route Error creating API key:", error.message)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Função auxiliar para gerar API Key, movida para cá para ser usada no server-side
const generateApiKeyInternal = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = "impaai_"
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
