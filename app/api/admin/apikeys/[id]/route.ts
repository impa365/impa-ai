import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await query('DELETE FROM user_api_keys WHERE id = $1', [id]);

    return NextResponse.json({ message: "API Key deleted successfully" });
  } catch (error: any) {
    console.error("❌ API Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
