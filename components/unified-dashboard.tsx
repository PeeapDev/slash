"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Brain, ChevronLeft, ChevronRight } from "lucide-react"
import AdminDashboard from "@/components/admin-dashboard"
import AIDashboard from "@/components/ai-dashboard"

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState("traditional")
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const tabs = [
    {
      id: "traditional",
      label: "Overview",
      icon: BarChart3
    },
    {
      id: "ai",
      label: "AI Analytics",
      icon: Brain
    }
  ]

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && activeTab === "traditional") {
      setActiveTab("ai")
    }
    if (isRightSwipe && activeTab === "ai") {
      setActiveTab("traditional")
    }
    
    setTouchStart(0)
    setTouchEnd(0)
  }

  return (
    <div className="space-y-4 p-4 lg:p-0">
      {/* Dashboard Tabs - Desktop Only */}
      <div className="hidden lg:block border-b border-border">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile Swipe Indicator */}
      <div className="lg:hidden flex items-center justify-center gap-2 py-2">
        <div className={`h-1 w-8 rounded-full transition-all ${
          activeTab === "traditional" ? "bg-primary" : "bg-muted"
        }`} />
        <div className={`h-1 w-8 rounded-full transition-all ${
          activeTab === "ai" ? "bg-primary" : "bg-muted"
        }`} />
      </div>

      {/* Tab Content - Swipeable on Mobile */}
      <div 
        className="min-h-[600px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === "traditional" && (
          <div className="space-y-6">
            <AdminDashboard />
          </div>
        )}
        
        {activeTab === "ai" && (
          <div className="space-y-6">
            <AIDashboard />
          </div>
        )}
      </div>

      {/* Quick Switch Buttons - Desktop Only */}
      <div className="hidden lg:flex fixed bottom-6 right-6 gap-2 z-50">
        <Button
          variant={activeTab === "traditional" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("traditional")}
          className="shadow-lg"
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Overview
        </Button>
        <Button
          variant={activeTab === "ai" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("ai")}
          className="shadow-lg"
        >
          <Brain className="w-4 h-4 mr-1" />
          AI Analytics
        </Button>
      </div>

      {/* Mobile Navigation Arrows */}
      <div className="lg:hidden fixed bottom-24 left-0 right-0 flex justify-between px-4 pointer-events-none z-50">
        {activeTab === "ai" && (
          <button
            onClick={() => setActiveTab("traditional")}
            className="pointer-events-auto p-3 bg-primary/90 text-primary-foreground rounded-full shadow-lg backdrop-blur-sm"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="flex-1" />
        {activeTab === "traditional" && (
          <button
            onClick={() => setActiveTab("ai")}
            className="pointer-events-auto p-3 bg-primary/90 text-primary-foreground rounded-full shadow-lg backdrop-blur-sm"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
