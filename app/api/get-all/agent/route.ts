import { type NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { queryOne, queryMany } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request);

    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json(
        {
          error: authResult.error || "Unauthorized",
          message: "API key validation failed",
        },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Logo após validar a API key, adicione:
    console.log("🔍 Iniciando busca do default_model...");

    // Buscar modelo padrão diretamente
    const defaultModelData = await queryOne(
      `SELECT setting_value FROM system_settings WHERE setting_key = $1`,
      ['default_model']
    );

    let systemDefaultModel = null;
    if (!defaultModelData) {
      console.error("❌ default_model não encontrado");
    } else if (defaultModelData.setting_value) {
      systemDefaultModel = defaultModelData.setting_value.toString().trim();
      console.log("✅ Default model encontrado:", systemDefaultModel);
    } else {
      console.error("❌ default_model não encontrado");
    }

    // Buscar agentes do usuário
    const agentCols = `id, name, description, model, training_prompt, temperature, max_tokens, status, created_at, updated_at, user_id, main_function, total_conversations, total_messages, performance_score, type, calendar_provider, calendar_api_version, calendar_api_url, calendar_api_key`;

    let agents;
    if (user.role !== "admin") {
      if (!user.id) {
        console.error("User ID is missing for non-admin role.");
        return NextResponse.json(
          { error: "User identification failed for non-admin." },
          { status: 400 }
        );
      }
      agents = await queryMany(
        `SELECT ${agentCols} FROM ai_agents WHERE status = 'active' AND user_id = $1 ORDER BY created_at DESC`,
        [user.id]
      );
    } else {
      agents = await queryMany(
        `SELECT ${agentCols} FROM ai_agents WHERE status = 'active' ORDER BY created_at DESC`
      );
    }

    const formattedAgents =
      agents?.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        model: agent.model || systemDefaultModel, // Usar apenas o valor do banco, sem fallback
        training_prompt: agent.training_prompt,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        status: agent.status,
        calendar_provider: agent.calendar_provider,
        calendar_api_version: agent.calendar_api_version,
        calendar_api_url: agent.calendar_api_url,
        calendar_api_key: agent.calendar_api_key,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        user_id: agent.user_id,
        main_function: agent.main_function,
        type: agent.type,
        stats: {
          total_conversations: agent.total_conversations || 0,
          total_messages: agent.total_messages || 0,
          performance_score: agent.performance_score || 0,
        },
      })) || [];

    return NextResponse.json({
      success: true,
      default_model: systemDefaultModel, // Valor direto do banco
      data: formattedAgents,
      total: formattedAgents.length,
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("API Route Error in /api/get-all/agent:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
