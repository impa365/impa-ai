import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { queryMany, queryOne, query, buildInsert, buildUpdate } from "@/lib/db"

export async function GET() {
  try {
    console.log("🔍 Buscando usuários via SQL direto...")

    const users = await queryMany(
      `SELECT * FROM user_profiles ORDER BY created_at DESC`
    )

    console.log("✅ Usuários encontrados:", users.length)

    // Mapear dados para formato seguro (SEM campos sensíveis)
    const safeUsers = users.map((user: any) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      agents_limit: user.agents_limit || 5,
      connections_limit: user.connections_limit || 2,
      whatsapp_connections_limit: user.connections_limit || 2,
      login_count: user.login_count || 0,
      can_access_agents: user.can_access_agents ?? true,
      can_access_connections: user.can_access_connections ?? true,
      hide_agents_menu: user.hide_agents_menu ?? false,
      hide_connections_menu: user.hide_connections_menu ?? false,
      can_view_api_credentials: user.can_view_api_credentials ?? false,
    }))

    return NextResponse.json({ success: true, users: safeUsers })
  } catch (error: any) {
    console.error("💥 Erro interno ao buscar usuários:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json()
    console.log("👤 Criando novo usuário:", userData.email)

    // Hash da senha antes de salvar
    let hashedPassword = userData.password
    if (userData.password) {
      const saltRounds = 12
      hashedPassword = await bcrypt.hash(userData.password, saltRounds)
      console.log("🔐 Senha hasheada para novo usuário")
    }

    const now = new Date().toISOString()
    const ins = buildInsert("user_profiles", {
      full_name: userData.full_name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || "user",
      status: userData.status || "active",
      agents_limit: userData.agents_limit || 5,
      connections_limit: userData.connections_limit || 2,
      can_access_agents: userData.can_access_agents ?? true,
      can_access_connections: userData.can_access_connections ?? true,
      hide_agents_menu: userData.hide_agents_menu ?? false,
      hide_connections_menu: userData.hide_connections_menu ?? false,
      can_view_api_credentials: userData.can_view_api_credentials ?? false,
      created_at: now,
      updated_at: now,
    })

    const newUser = await queryOne(ins.text, ins.values)
    console.log("✅ Usuário criado com sucesso:", newUser?.email)

    return NextResponse.json({ user: newUser })
  } catch (error: any) {
    console.error("💥 Erro ao criar usuário:", error.message)
    if (error.code === "23505" && error.constraint?.includes("email")) {
      return NextResponse.json({ error: "Já existe um usuário com este email" }, { status: 409 })
    }
    if (error.code === "23505") {
      return NextResponse.json({ error: "Registro duplicado: " + (error.detail || error.message) }, { status: 409 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const userData = await request.json()
    const { id, ...updateData } = userData

    console.log("✏️ Atualizando usuário:", id)

    // Se há senha nos dados, fazer hash
    if (updateData.password) {
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(updateData.password, saltRounds)
      updateData.password = hashedPassword
      console.log("🔐 Senha hasheada para atualização")
    }

    updateData.updated_at = new Date().toISOString()

    const upd = buildUpdate("user_profiles", updateData, { id })
    const updatedUser = await queryOne(upd.text, upd.values)

    console.log("✅ Usuário atualizado com sucesso")

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error("💥 Erro ao atualizar usuário:", error.message)
    if (error.code === "23505" && error.constraint?.includes("email")) {
      return NextResponse.json({ error: "Já existe um usuário com este email" }, { status: 409 })
    }
    if (error.code === "23505") {
      return NextResponse.json({ error: "Registro duplicado: " + (error.detail || error.message) }, { status: 409 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 })
    }

    console.log("🗑️ Deletando usuário:", userId)

    await query(`DELETE FROM user_profiles WHERE id = $1`, [userId])

    console.log("✅ Usuário deletado com sucesso")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("💥 Erro ao deletar usuário:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
