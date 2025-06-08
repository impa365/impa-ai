import bcrypt from "bcryptjs"

const password = "admin123" // <-- Altere esta linha para a senha que você quer hashear
const saltRounds = 10 // Custo computacional, 10 é um bom valor padrão

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, saltRounds)
    console.log(`Senha original: "${password}"`)
    console.log(`Hash gerado: "${hash}"`)
    console.log(
      "\n⚠️ Importante: O hash será diferente a cada execução devido ao salt aleatório. Use o hash que aparecer no console.",
    )
  } catch (error) {
    console.error("Erro ao gerar o hash:", error)
  }
}

generateHash()
