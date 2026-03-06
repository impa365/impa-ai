import { type NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { getUazapiPrivacySettingsServer, setUazapiPrivacySettingsServer } from "@/lib/uazapi-server"
import { query, queryOne } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    // 🔧 CORREÇÃO: Await params antes de usar suas propriedades
    const resolvedParams = await params;
    const { instanceName } = resolvedParams;

    console.log(`🔍 [SETTINGS-GET] Buscando configurações para instância: ${instanceName}`);

    const user = await getCurrentServerUser(request)
    if (!user) {
      console.error("❌ [SETTINGS-GET] Usuário não autorizado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log(`✅ [SETTINGS-GET] Usuário autorizado: ${user.email} (${user.role})`);

    // Buscar a conexão pela instance_name incluindo api_type e instance_token
    let connection;
    if (user.role === "admin") {
      connection = await queryOne(
        `SELECT * FROM whatsapp_connections WHERE instance_name = $1 LIMIT 1`,
        [instanceName]
      )
    } else {
      connection = await queryOne(
        `SELECT * FROM whatsapp_connections WHERE instance_name = $1 AND user_id = $2 LIMIT 1`,
        [instanceName, user.id]
      )
    }

    if (!connection) {
      console.error(`❌ [SETTINGS-GET] Conexão não encontrada para instância: ${instanceName}`);
      return NextResponse.json(
        { error: "Conexão não encontrada" },
        { status: 404 }
      )
    }

    console.log(`✅ [SETTINGS-GET] Conexão encontrada no banco`);

    const apiType = connection.api_type || "evolution"

    console.log(`📡 [SETTINGS-GET] Tipo de API: ${apiType}`);

    // ==================== ROTEAR PARA A API CORRETA ====================

    if (apiType === "uazapi") {
      // ========== UAZAPI ==========
      try {
        console.log(`🌐 [SETTINGS-GET] Buscando configurações da Uazapi...`);
        
        const uazapiResult = await getUazapiPrivacySettingsServer(connection.instance_token)

        if (uazapiResult.success && uazapiResult.data) {
          console.log(`✅ [SETTINGS-GET] Configurações carregadas da Uazapi`);
          console.log(`⚙️ [SETTINGS-GET] Configurações recebidas:`, JSON.stringify(uazapiResult.data, null, 2));

          return NextResponse.json({
            success: true,
            settings: uazapiResult.data,
            source: "uazapi",
            connection: connection
          })
        } else {
          console.error(`❌ [SETTINGS-GET] Erro na Uazapi:`, uazapiResult.error);
          throw new Error(uazapiResult.error || "Uazapi não disponível")
        }
      } catch (uazapiError: any) {
        console.error(`❌ [SETTINGS-GET] Falha na Uazapi:`, uazapiError.message);

        return NextResponse.json(
          {
            success: false,
            error: `Erro ao carregar configurações: ${uazapiError.message}`,
            details: "Verifique se a Uazapi está online e configurada corretamente"
          },
          { status: 503 }
        )
      }
    } else {
      // ========== EVOLUTION API ==========
      try {
        console.log(`🌐 [SETTINGS-GET] Chamando Evolution API para configurações...`);
        
        // 🔧 CORREÇÃO: Usar URL absoluta para chamada interna
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/settings/${instanceName}`;
        
        console.log(`🔗 [SETTINGS-GET] URL da chamada interna: ${evolutionApiUrl}`);
        
        const evolutionResponse = await fetch(evolutionApiUrl, {
          headers: {
            'Content-Type': 'application/json',
            // Repassar cookies para autenticação interna
            'Cookie': request.headers.get('cookie') || ''
          }
        });
        
        console.log(`📡 [SETTINGS-GET] Status da Evolution API: ${evolutionResponse.status}`);
        
        const evolutionResult = await evolutionResponse.json()
        
        // 🔍 LOG DETALHADO DA RESPOSTA (APENAS SERVIDOR)
        console.log(`📥 [SETTINGS-GET] Resposta completa da Evolution API:`, JSON.stringify(evolutionResult, null, 2));

        if (evolutionResponse.ok && evolutionResult.success) {
          console.log(`✅ [SETTINGS-GET] Configurações carregadas da Evolution API`);
          console.log(`⚙️ [SETTINGS-GET] Configurações recebidas:`, JSON.stringify(evolutionResult.settings, null, 2));
          
          return NextResponse.json({
            success: true,
            settings: evolutionResult.settings,
            source: evolutionResult.source,
            warning: evolutionResult.warning,
            connection: connection
          })
        } else {
          console.error(`❌ [SETTINGS-GET] Erro na Evolution API:`, evolutionResult.error);
          console.error(`🔍 [SETTINGS-GET] Detalhes do erro:`, JSON.stringify(evolutionResult, null, 2));
          throw new Error(evolutionResult.error || "Evolution API não disponível")
        }
      } catch (evolutionError: any) {
        console.error(`❌ [SETTINGS-GET] Falha na Evolution API:`, evolutionError.message);
        console.error(`🔍 [SETTINGS-GET] Stack trace:`, evolutionError.stack);
        
        // 🚫 REMOVIDO: Configurações padrão - SEMPRE retornar erro se Evolution API falhar
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao carregar configurações: ${evolutionError.message}`,
            details: "Verifique se a Evolution API está online e configurada corretamente"
          },
          { status: 503 }
        )
      }
    }
  } catch (error: any) {
    console.error("❌ [SETTINGS-GET] Erro interno:", error.message);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    // 🔧 CORREÇÃO: Await params antes de usar suas propriedades
    const resolvedParams = await params;
    const { instanceName } = resolvedParams;
    
    console.log(`🔄 [SETTINGS-PUT] Atualizando configurações para instância: ${instanceName}`);
    
    const user = await getCurrentServerUser(request)
    if (!user) {
      console.error("❌ [SETTINGS-PUT] Usuário não autorizado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log(`✅ [SETTINGS-PUT] Usuário autorizado: ${user.email} (${user.role})`);
    
    const body = await request.json()
    const { adciona_folow, remover_folow } = body

    // Primeiro, verificar se a conexão existe e pertence ao usuário
    const connection = await queryOne<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM whatsapp_connections WHERE instance_name = $1 LIMIT 1`,
      [instanceName]
    )

    if (!connection) {
      return NextResponse.json(
        { error: "Conexão não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem permissão
    if (user.role !== "admin" && connection.user_id !== user.id) {
      return NextResponse.json(
        { error: "Sem permissão para modificar esta conexão" },
        { status: 403 }
      )
    }

    // Atualizar as colunas adciona_folow e remover_folow
    const setClauses: string[] = [`updated_at = $1`]
    const values: any[] = [new Date().toISOString()]
    let paramIdx = 2

    // Adicionar apenas os campos que foram fornecidos
    if (adciona_folow !== undefined) {
      setClauses.push(`adciona_folow = $${paramIdx}`)
      values.push(adciona_folow)
      paramIdx++
    }
    if (remover_folow !== undefined) {
      setClauses.push(`remover_folow = $${paramIdx}`)
      values.push(remover_folow)
      paramIdx++
    }

    values.push(instanceName)
    const updatedConnection = await queryOne(
      `UPDATE whatsapp_connections SET ${setClauses.join(", ")} WHERE instance_name = $${paramIdx} RETURNING *`,
      values
    )

    if (!updatedConnection) {
      return NextResponse.json(
        { error: "Erro ao salvar configurações" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso",
      adciona_folow: updatedConnection.adciona_folow,
      remover_folow: updatedConnection.remover_folow,
    })
  } catch (error) {
    console.error("Erro ao salvar configurações:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    // 🔧 CORREÇÃO: Await params antes de usar suas propriedades
    const resolvedParams = await params;
    const { instanceName } = resolvedParams;
    const settings = await request.json();

    console.log(`💾 [SETTINGS-POST] Salvando configurações para instância: ${instanceName}`);
    console.log(`📝 [SETTINGS-POST] Dados recebidos:`, JSON.stringify(settings, null, 2));

    const user = await getCurrentServerUser(request)
    if (!user) {
      console.error("❌ [SETTINGS-POST] Usuário não autorizado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log(`✅ [SETTINGS-POST] Usuário autorizado: ${user.email} (${user.role})`);

    // Verificar se o usuário tem permissão para esta instância (incluir api_type e instance_token)
    let connection;
    if (user.role === "admin") {
      connection = await queryOne(
        `SELECT * FROM whatsapp_connections WHERE instance_name = $1 LIMIT 1`,
        [instanceName]
      )
    } else {
      connection = await queryOne(
        `SELECT * FROM whatsapp_connections WHERE instance_name = $1 AND user_id = $2 LIMIT 1`,
        [instanceName, user.id]
      )
    }

    if (!connection) {
      console.error(`❌ [SETTINGS-POST] Conexão não encontrada ou sem permissão`);
      return NextResponse.json(
        { error: "Conexão não encontrada ou sem permissão" },
        { status: 404 }
      )
    }

    console.log(`✅ [SETTINGS-POST] Permissões verificadas`);

    const apiType = connection.api_type || "evolution"

    console.log(`📡 [SETTINGS-POST] Tipo de API: ${apiType}`);

    // ==================== ROTEAR PARA A API CORRETA ====================

    if (apiType === "uazapi") {
      // ========== UAZAPI ==========
      try {
        console.log(`🌐 [SETTINGS-POST] Salvando configurações na Uazapi...`);
        console.log(`📤 [SETTINGS-POST] Payload para Uazapi:`, JSON.stringify(settings, null, 2));

        const uazapiResult = await setUazapiPrivacySettingsServer(connection.instance_token, settings)

        if (uazapiResult.success) {
          console.log(`✅ [SETTINGS-POST] Configurações salvas na Uazapi com sucesso`);
          return NextResponse.json({
            success: true,
            message: "Configurações salvas com sucesso na Uazapi",
            source: "uazapi"
          })
        } else {
          console.error(`❌ [SETTINGS-POST] Erro na Uazapi:`, uazapiResult.error);
          return NextResponse.json(
            {
              success: false,
              error: uazapiResult.error || "Erro ao salvar na Uazapi",
            },
            { status: 500 }
          )
        }
      } catch (uazapiError: any) {
        console.error(`❌ [SETTINGS-POST] Falha crítica na Uazapi:`, uazapiError.message);
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao conectar com Uazapi: ${uazapiError.message}`,
            details: "Verifique se a Uazapi está online e configurada corretamente"
          },
          { status: 503 }
        )
      }
    } else {
      // ========== EVOLUTION API ==========
      try {
        console.log(`🌐 [SETTINGS-POST] Enviando para Evolution API...`);
        
        // 🔧 CORREÇÃO: Usar URL absoluta para chamada interna
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const evolutionApiUrl = `${baseUrl}/api/integrations/evolution/settings/${instanceName}`;
        
        console.log(`🔗 [SETTINGS-POST] URL da chamada interna: ${evolutionApiUrl}`);
        console.log(`📤 [SETTINGS-POST] Payload para Evolution API:`, JSON.stringify(settings, null, 2));
        
        const evolutionResponse = await fetch(evolutionApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Repassar cookies para autenticação interna
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify(settings),
        })

        console.log(`📡 [SETTINGS-POST] Status da Evolution API: ${evolutionResponse.status}`);

        const evolutionResult = await evolutionResponse.json()

        // 🔍 LOG DETALHADO DA RESPOSTA (APENAS SERVIDOR)
        console.log(`📥 [SETTINGS-POST] Resposta completa da Evolution API:`, JSON.stringify(evolutionResult, null, 2));

        if (evolutionResponse.ok && evolutionResult.success) {
          console.log(`✅ [SETTINGS-POST] Configurações salvas na Evolution API com sucesso`);
          return NextResponse.json({
            success: true,
            message: "Configurações salvas com sucesso na Evolution API",
            source: evolutionResult.source
          })
        } else {
          console.error(`❌ [SETTINGS-POST] Erro na Evolution API:`, evolutionResult.error);
          console.error(`🔍 [SETTINGS-POST] Detalhes do erro:`, JSON.stringify(evolutionResult, null, 2));
          return NextResponse.json(
            {
              success: false,
              error: evolutionResult.error || "Erro ao salvar na Evolution API",
              details: evolutionResult.details
            },
            { status: evolutionResponse.status || 500 }
          )
        }
      } catch (evolutionError: any) {
        console.error(`❌ [SETTINGS-POST] Falha crítica na Evolution API:`, evolutionError.message);
        console.error(`🔍 [SETTINGS-POST] Stack trace:`, evolutionError.stack);
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao conectar com Evolution API: ${evolutionError.message}`,
            details: "Verifique se a Evolution API está online e configurada corretamente"
          },
          { status: 503 }
        )
      }
    }
  } catch (error: any) {
    console.error("❌ [SETTINGS-POST] Erro interno:", error.message);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
