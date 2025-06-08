import bcrypt from "bcryptjs"

const password = "admin123"
const saltRounds = 10 // Custo computacional, 10 é um bom valor padrão

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, saltRounds)
    console.log(`Senha original: "${password}"`)
    console.log(`Hash gerado: "${hash}"`)
    console.log("\nNote: O hash será diferente a cada execução devido ao salt aleatório.")
  } catch (error) {
    console.error("Erro ao gerar o hash:", error)
  }
}

generateHash()
