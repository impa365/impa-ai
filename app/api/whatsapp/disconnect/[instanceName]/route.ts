import { type NextRequest, NextResponse } from "next/server";
import { disconnectUazapiInstanceServer } from "@/lib/uazapi-server";
import { requireAuth, hasPermission } from "@/lib/auth-utils";
import { logAccessDenied } from "@/lib/security-audit";
import { query, queryOne, queryMany } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    // Next.js 15: await params
    const { instanceName } = await params;

    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    // 🔒 SEGURANÇA: Autenticar usuário
    let user;
    try {
      user = await requireAuth(request);
    } catch (authError) {
      console.error("❌ [DISCONNECT] Não autorizado:", (authError as Error).message);
      logAccessDenied(undefined, undefined, `/api/whatsapp/disconnect/${instanceName}`, request, 'Token JWT inválido ou ausente')
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    console.log("✅ [DISCONNECT] Usuário autenticado:", user.email);

    // Buscar dados da conexão incluindo user_id para validar propriedade
    console.log(`🔍 [DISCONNECT] Buscando dados da conexão: ${instanceName}`);
    const connections = await queryMany(
      'SELECT id, instance_name, user_id, api_type, instance_token FROM whatsapp_connections WHERE instance_name = $1',
      [instanceName]
    );
    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { success: false, error: "Conexão não encontrada" },
        { status: 404 }
      );
    }

    const connection = connections[0];

    // 🔒 SEGURANÇA: Validar propriedade da conexão
    if (!hasPermission(user.id, connection.user_id, user.role)) {
      console.error("❌ [DISCONNECT] Acesso negado: usuário não é dono nem admin");
      logAccessDenied(user.id, user.email, `/api/whatsapp/disconnect/${instanceName}`, request, 'Usuário não é dono da conexão')
      return NextResponse.json(
        { success: false, error: "Você não tem permissão para desconectar esta instância" },
        { status: 403 }
      );
    }

    console.log("✅ [DISCONNECT] Permissão validada:", user.role === "admin" ? "admin" : "owner");

    const apiType = connection.api_type || "evolution";
    const instanceToken = connection.instance_token;

    console.log(`🔄 [DISCONNECT] Iniciando desconexão da instância: ${instanceName} (${apiType})`);

    // === UAZAPI ===
    if (apiType === "uazapi") {
      console.log(`🔵 [DISCONNECT-UAZAPI] Desconectando via Uazapi...`);
      
      if (!instanceToken) {
        return NextResponse.json(
          { success: false, error: "Token da instância não encontrado" },
          { status: 500 }
        );
      }

      const disconnectResult = await disconnectUazapiInstanceServer(instanceToken);

      if (!disconnectResult.success) {
        console.error(`❌ [DISCONNECT-UAZAPI] Erro:`, disconnectResult.error);
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao desconectar via Uazapi: ${disconnectResult.error}`,
          },
          { status: 500 }
        );
      }

      console.log(`✅ [DISCONNECT-UAZAPI] Desconexão bem-sucedida`);

      // Atualizar status no banco
      await query(
        'UPDATE whatsapp_connections SET status = $1, phone_number = $2, updated_at = $3 WHERE instance_name = $4',
        ['disconnected', null, new Date().toISOString(), instanceName]
      );

      return NextResponse.json({
        success: true,
        message: "Instância Uazapi desconectada com sucesso",
      });
    }

    // === EVOLUTION API ===
    console.log(`🟢 [DISCONNECT-EVOLUTION] Desconectando via Evolution API...`);
    
    const integrations = await queryMany(
      'SELECT config FROM integrations WHERE type = $1 AND is_active = true',
      ['evolution_api']
    );

    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada" },
        { status: 500 }
      );
    }

    const config = integrations[0].config;

    if (!config?.apiUrl || !config?.apiKey) {
      return NextResponse.json(
        { success: false, error: "Configuração da Evolution API incompleta" },
        { status: 500 }
      );
    }

    console.log(`🔗 [DISCONNECT-EVOLUTION] Chamando: ${config.apiUrl}/instance/logout/${instanceName}`);
    
    const logoutResponse = await fetch(
      `${config.apiUrl}/instance/logout/${instanceName}`,
      {
        method: "DELETE",
        headers: {
          apikey: config.apiKey,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    console.log(`📡 [DISCONNECT-EVOLUTION] Response status: ${logoutResponse.status}`);

    if (!logoutResponse.ok) {
      const errorText = await logoutResponse.text();
      console.error(`❌ [DISCONNECT-EVOLUTION] Erro: ${logoutResponse.status} - ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao desconectar: ${logoutResponse.status} - ${errorText}`,
        },
        { status: 500 }
      );
    }

    const logoutData = await logoutResponse.json();
    console.log(`✅ [DISCONNECT-EVOLUTION] Desconexão bem-sucedida:`, logoutData);

    // Atualizar status no banco de dados
    await query(
      'UPDATE whatsapp_connections SET status = $1, phone_number = $2, updated_at = $3 WHERE instance_name = $4',
      ['disconnected', null, new Date().toISOString(), instanceName]
    );

    return NextResponse.json({
      success: true,
      message: "Instância desconectada com sucesso",
      data: logoutData,
    });
  } catch (error: any) {
    console.error("Erro ao desconectar instância:", error);

    if (error.name === "TimeoutError") {
      return NextResponse.json(
        { success: false, error: "Timeout ao desconectar instância" },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
