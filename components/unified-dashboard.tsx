"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Brain, TrendingUp } from "lucide-react"
import AdminDashboard from "@/components/admin-dashboard"
import AIDashboard from "@/components/ai-dashboard"

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState("traditional")

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

  return (
    <div className="space-y-4">
      {/* Dashboard Tabs */}
      <div className="border-b border-border">
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

      {/* Tab Content */}
      <div className="min-h-[600px]">
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

      {/* Quick Switch Buttons (Floating) */}
      <div className="fixed bottom-6 right-6 flex gap-2 z-50">
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
    </div>
  )
}
