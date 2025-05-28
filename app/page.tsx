"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"
import { getCurrentUser } from "@/lib/auth"

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <LoginForm />
}
