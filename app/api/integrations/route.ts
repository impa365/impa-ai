import { NextResponse } from "next/server"
import { query, queryMany, buildInsert, buildUpdate } from "@/lib/db"

export async function GET() {
  try {
    const integrations = await queryMany(
      'SELECT * FROM integrations ORDER BY created_at DESC'
    )

    return NextResponse.json({
      success: true,
      integrations,
    })
  } catch (error: any) {
    console.error("Erro ao buscar integrações:", error.message)
    return NextResponse.json({
      success: false,
      integrations: [],
      error: "Erro ao conectar com o banco de dados. Verifique se as tabelas foram criadas.",
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, name, config } = body

    // Validação dos dados
    if (!type || !config) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo e configuração são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Verificar se já existe uma integração deste tipo
    const existing = await queryMany('SELECT * FROM integrations WHERE type = $1', [type])

    if (existing.length > 0) {
      // Atualizar integração existente
      const { text: updateSql, values: updateValues } = buildUpdate(
        'integrations',
        {
          name: name || existing[0].name,
          config: config,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { id: existing[0].id }
      )
      await query(updateSql, updateValues)

      return NextResponse.json({
        success: true,
        message: "Integração atualizada com sucesso!",
        action: "updated",
      })
    }

    // Criar nova integração
    const { text: insertSql, values: insertValues } = buildInsert('integrations', {
      name: name || (type === "evolution_api" ? "Evolution API" : type === "n8n" ? "n8n" : type === "uazapi" ? "Uazapi" : "n8n Session"),
      type,
      config,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    await query(insertSql, insertValues)

    return NextResponse.json({
      success: true,
      message: "Integração criada com sucesso!",
      action: "created",
    })
  } catch (error: any) {
    console.error("Erro ao salvar integração:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: `Erro ao salvar integração: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
