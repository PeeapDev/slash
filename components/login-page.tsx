"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const DEMO_CREDENTIALS = [
  { id: "admin1", name: "Admin User", email: "admin@slash.org", role: "superadmin", password: "1234" },
  { id: "user1", name: "Sarah Johnson", email: "sarah@slash.org", role: "field_collector", password: "1234" },
  { id: "user2", name: "Dr. Ahmed Hassan", email: "ahmed@slash.org", role: "lab_technician", password: "1234" },
  { id: "user3", name: "Rebecca Smith", email: "rebecca@slash.org", role: "supervisor", password: "1234" },
]

export default function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = (user) => {
    if (password === user.password) {
      onLogin(user)
      setError("")
    } else {
      setError("Incorrect password. Demo password is 1234")
    }
  }

  const roleLabels = {
    superadmin: "SuperAdmin",
    field_collector: "Field Data Collector",
    lab_technician: "Lab Technician",
    supervisor: "Supervisor",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">SLASH Tool</h1>
          <p className="text-slate-600">Household & Lab Data Capture</p>
        </div>

        {!selectedRole ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 mb-6 text-center">Select your role to continue</p>
            {DEMO_CREDENTIALS.map((user) => (
              <Button
                key={user.id}
                onClick={() => setSelectedRole(user)}
                variant="outline"
                className="w-full h-16 flex flex-col items-center justify-center gap-1 hover:bg-blue-50"
              >
                <span className="font-semibold text-slate-900">{user.name}</span>
                <span className="text-xs text-slate-600">{roleLabels[user.role]}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Logging in as <span className="font-semibold">{selectedRole.name}</span>
              </p>
              <button
                onClick={() => {
                  setSelectedRole(null)
                  setPassword("")
                  setError("")
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Change user
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password) {
                    handleLogin(selectedRole)
                  }
                }}
                placeholder="Enter password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              <p className="text-xs text-slate-500 mt-2">Demo password: 1234</p>
            </div>
            <Button
              onClick={() => handleLogin(selectedRole)}
              disabled={!password}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
