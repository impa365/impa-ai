"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"
import DynamicTitle from "@/components/dynamic-title"
import { getCurrentUser } from "@/lib/auth"

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
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
      } catch (error) {
        console.error("Error checking user:", error)
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <>
        <DynamicTitle />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <DynamicTitle />
      <LoginForm />
    </>
  )
}
