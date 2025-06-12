import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("SIMPLE TEST: Rota simples executada")

  return NextResponse.json({
    message: "Rota simples funcionando",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
}
