import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    });

    const { error } = await supabase
      .from("user_api_keys")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Error deleting API key:", error);
      return NextResponse.json(
        { error: "Failed to delete API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "API Key deleted successfully" });
  } catch (error: any) {
    console.error("❌ API Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
