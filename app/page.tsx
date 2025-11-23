"use client"

import { useState, useEffect } from "react"
import LoginPage from "@/components/login-page"
import AppLayout from "@/components/app-layout"
import AdminLayout from "@/components/admin-layout"

export default function Home() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("currentUser")
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return (
      <LoginPage
        onLogin={(credentials) => {
          setUser(credentials)
          localStorage.setItem("currentUser", JSON.stringify(credentials))
        }}
      />
    )
  }

  if (user.role === "superadmin") {
    return (
      <AdminLayout
        user={user}
        onLogout={() => {
          setUser(null)
          localStorage.removeItem("currentUser")
        }}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    )
  }

  return (
    <AppLayout
      user={user}
      onLogout={() => {
        setUser(null)
        localStorage.removeItem("currentUser")
      }}
    />
  )
}
