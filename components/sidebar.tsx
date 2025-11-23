"use client"

import { cn } from "@/lib/utils"
import {
  BarChart3,
  Users,
  FileText,
  Droplet,
  Beaker,
  Search,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
} from "lucide-react"

export default function Sidebar({ role, currentPage, onPageChange }) {
  const menuItems = {
    field_collector: [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "household_registration", label: "Register Household", icon: Users },
      { id: "participant_registration", label: "Register Participant", icon: Users },
      { id: "questionnaire", label: "Questionnaire", icon: FileText },
      { id: "sample_collection", label: "Collect Sample", icon: Droplet },
    ],
    lab_technician: [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "sample_search", label: "Search Samples", icon: Search },
      { id: "results_entry", label: "Enter Results", icon: CheckCircle2 },
      { id: "batch_entry", label: "Batch Entry", icon: ClipboardList },
    ],
    supervisor: [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "issue_review", label: "Review Issues", icon: AlertCircle },
    ],
  }

  const items = menuItems[role] || []

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen border-r border-slate-800">
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Beaker className="w-6 h-6 text-blue-400" />
          <h2 className="text-lg font-bold">SLASH</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">Data Capture Tool</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <p className="text-xs text-slate-400 text-center">Version 1.0</p>
      </div>
    </div>
  )
}
