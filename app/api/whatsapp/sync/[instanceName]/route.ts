import { type NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    // 🔧 CORREÇÃO: Await params antes de usar suas propriedades
    const resolvedParams = await params;
    const { instanceName } = resolvedParams;

    console.log(`🔄 [SYNC] Iniciando sincronização para instância: ${instanceName}`);

    if (!instanceName) {
      console.error("❌ [SYNC] Nome da instância é obrigatório");
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar configuração da Evolution API
    const integration = await queryOne<{ config: any }>(
      `SELECT config FROM integrations WHERE type = $1 AND is_active = true LIMIT 1`,
      ["evolution_api"]
    );

    if (!integration) {
      return NextResponse.json(
        { success: false, error: "Evolution API não configurada" },
        { status: 500 }
      );
    }

    const config = integration.config;

    if (!config?.apiUrl || !config?.apiKey) {
      return NextResponse.json(
        { success: false, error: "Configuração da Evolution API incompleta" },
        { status: 500 }
      );
    }

    // Verificar status real na Evolution API
    const statusResponse = await fetch(
      `${config.apiUrl}/instance/connectionState/${instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: config.apiKey,
        },
        signal: AbortSignal.timeout(8000), // 8 segundos timeout
      }
    );

    let realStatus = "disconnected";
    let phoneNumber = null;

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();

      // Mapear status da Evolution API para nosso formato
      if (statusData?.instance?.state) {
        switch (statusData.instance.state) {
          case "open":
            realStatus = "connected";
            break;
          case "connecting":
            realStatus = "connecting";
            break;
          case "close":
          default:
            realStatus = "disconnected";
            break;
        }
      }

      // Capturar número do telefone se disponível
      phoneNumber =
        statusData?.instance?.wuid || statusData?.instance?.number || null;
    }

    // Atualizar status no banco de dados
    const setClauses: string[] = [`status = $1`, `updated_at = $2`];
    const values: any[] = [realStatus, new Date().toISOString()];
    let paramIdx = 3;

    // Adicionar número do telefone se disponível
    if (phoneNumber) {
      setClauses.push(`phone_number = $${paramIdx}`);
      values.push(phoneNumber);
      paramIdx++;
    }

    values.push(instanceName);
    const updatedConnection = await queryOne(
      `UPDATE whatsapp_connections SET ${setClauses.join(", ")} WHERE instance_name = $${paramIdx} RETURNING *`,
      values
    );

    return NextResponse.json({
      success: true,
      status: realStatus,
      phoneNumber: phoneNumber,
      updated: true,
      connection: updatedConnection || null,
      message: `Status sincronizado: ${realStatus}`,
    });
  } catch (error: any) {
    console.error("Erro na sincronização:", error);

    if (error.name === "TimeoutError") {
      return NextResponse.json(
        {
          success: false,
          error: "Timeout ao verificar status na Evolution API",
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
