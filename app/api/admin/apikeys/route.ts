import { NextResponse } from "next/server";
import { queryOne, queryMany, buildInsert } from "@/lib/db";

export async function GET() {
  try {
    const data = await queryMany(
      `SELECT
        k.id,
        k.user_id,
        k.name,
        k.api_key,
        k.description,
        k.is_active,
        k.last_used_at,
        k.created_at,
        json_build_object(
          'full_name', p.full_name,
          'email', p.email,
          'role', p.role
        ) AS user_profiles
      FROM user_api_keys k
      INNER JOIN user_profiles p ON p.id = k.user_id
      ORDER BY k.created_at DESC`
    );

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("❌ API Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, name, description } = await request.json();

    if (!userId || !name?.trim()) {
      return NextResponse.json(
        { error: "User ID and key name are required" },
        { status: 400 }
      );
    }

    // Gerar API Key
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let newApiKey = "impaai_";
    for (let i = 0; i < 32; i++) {
      newApiKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const { text, values } = buildInsert("user_api_keys", {
      user_id: userId,
      name: name.trim(),
      api_key: newApiKey,
      description:
        description?.trim() || "API Key para integração com sistemas externos",
      permissions: ["read"],
      rate_limit: 100,
      is_active: true,
      is_admin_key: false,
      access_scope: "user",
      allowed_ips: [],
      usage_count: 0,
    });

    await queryOne(text, values);

    return NextResponse.json(
      { message: "API Key created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ API Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
