"use client"

import { useState, useEffect } from "react"
import PWALandingPage from "@/components/pwa-landing-page"
import LoginPage from "@/components/login-page"
import AdminLayout from "@/components/admin-layout"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(true)
  const [currentPage, setCurrentPage] = useState("dashboard")

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("current_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setShowLanding(false)
    }
    
    // Check if user has seen landing page
    const hasSeenLanding = localStorage.getItem("has_seen_landing")
    if (hasSeenLanding === "true") {
      setShowLanding(false)
    }
    
    setIsLoading(false)
  }, [])

  const handleContinueFromLanding = () => {
    setShowLanding(false)
    localStorage.setItem("has_seen_landing", "true")
  }

  const handleLogin = () => {
    // Create a default user object for the session
    const userData = { name: "Admin User", role: "superadmin" }
    setUser(userData)
    localStorage.setItem("current_user", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("current_user")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page on first visit
  if (showLanding && !user) {
    return <PWALandingPage onContinue={handleContinueFromLanding} />
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  console.log('🚀 Page.tsx: Rendering AdminLayout with props:', {
    user: user?.name,
    currentPage,
    hasOnPageChange: typeof setCurrentPage === 'function'
  })

  return (
    <div className="min-h-screen bg-background">
      <AdminLayout 
        user={user}
        onLogout={handleLogout}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
