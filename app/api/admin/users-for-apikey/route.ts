import { NextResponse } from "next/server";
import { queryMany } from "@/lib/db";

export async function GET() {
  try {
    const data = await queryMany(
      `SELECT id, full_name, email, role
       FROM user_profiles
       WHERE status = $1
       ORDER BY full_name ASC`,
      ['active']
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
