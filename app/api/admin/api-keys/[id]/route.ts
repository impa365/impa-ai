import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  const id = params.id

  try {
    const response = await fetch(`/api/database/api-keys/${id}`, {
      // Caminho relativo
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("Error deleting API key:", response.status, response.statusText)
      return new NextResponse(JSON.stringify({ message: "Failed to delete API key" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    return new NextResponse(JSON.stringify({ message: "API key deleted successfully" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error deleting API key:", error)
    return new NextResponse(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
