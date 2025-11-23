"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Database, 
  Cloud, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Eye,
  UserPlus,
  LogIn,
  LogOut
} from "lucide-react"

interface User {
  id: string
  email: string
  fullName: string
  role: string
  regionId?: string
  districtId?: string
  isActive: boolean
  createdAt: string
}

export default function DualDatabaseDemo() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Registration form state
  const [regForm, setRegForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'field_collector',
    regionId: 'western',
    districtId: 'freetown'
  })

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Load users from Neon database
  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data)
        showMessage('success', `Loaded ${data.count} users from Neon PostgreSQL`)
      } else {
        showMessage('error', data.error)
      }
    } catch (error) {
      showMessage('error', 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  // Register new user (Supabase Auth + Neon Database)
  const registerUser = async () => {
    if (!regForm.email || !regForm.password || !regForm.fullName) {
      showMessage('error', 'Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        showMessage('success', `User registered in Supabase Auth & saved to Neon PostgreSQL!`)
        setRegForm({ email: '', password: '', fullName: '', role: 'field_collector', regionId: 'western', districtId: 'freetown' })
        loadUsers() // Refresh user list
      } else {
        showMessage('error', data.error)
      }
    } catch (error) {
      showMessage('error', 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Login user (Supabase Auth + Neon Database)
  const loginUser = async () => {
    if (!loginForm.email || !loginForm.password) {
      showMessage('error', 'Please enter email and password')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCurrentUser(data.user)
        setIsLoggedIn(true)
        setLoginForm({ email: '', password: '' })
        showMessage('success', `Logged in via Supabase! Data from Neon PostgreSQL.`)
      } else {
        showMessage('error', data.error)
      }
    } catch (error) {
      showMessage('error', 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Logout user
  const logoutUser = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/session', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setCurrentUser(null)
        setIsLoggedIn(false)
        showMessage('success', 'Logged out from Supabase')
      }
    } catch (error) {
      showMessage('error', 'Logout failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Check current session
  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      
      if (data.success && data.user) {
        setCurrentUser(data.user)
        setIsLoggedIn(true)
      }
    } catch (error) {
      console.log('No active session')
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  useEffect(() => {
    loadUsers()
    checkSession()
  }, [])

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Dual Database Integration Demo</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Cloud className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Supabase Auth</h3>
              <p className="text-sm text-blue-600">Authentication & Real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <Database className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Neon PostgreSQL</h3>
              <p className="text-sm text-green-600">Primary Data Storage</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 inline mr-2" /> : <AlertCircle className="w-4 h-4 inline mr-2" />}
            {message.text}
          </div>
        )}

        {/* Current Session Status */}
        {isLoggedIn && currentUser && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Logged in as {currentUser.fullName}</p>
                  <p className="text-sm text-green-600">Role: {currentUser.role} | Email: {currentUser.email}</p>
                </div>
              </div>
              <Button onClick={logoutUser} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* User Registration */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Register New User
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="Email"
                type="email"
                value={regForm.email}
                onChange={(e) => setRegForm({...regForm, email: e.target.value})}
              />
              <Input
                placeholder="Password"
                type="password"
                value={regForm.password}
                onChange={(e) => setRegForm({...regForm, password: e.target.value})}
              />
              <Input
                placeholder="Full Name"
                value={regForm.fullName}
                onChange={(e) => setRegForm({...regForm, fullName: e.target.value})}
              />
              <select 
                className="w-full p-2 border rounded"
                value={regForm.role}
                onChange={(e) => setRegForm({...regForm, role: e.target.value})}
              >
                <option value="field_collector">Field Collector</option>
                <option value="supervisor">Supervisor</option>
                <option value="lab_technician">Lab Technician</option>
                <option value="admin">Admin</option>
              </select>
              <Button 
                onClick={registerUser} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Register in Supabase + Neon
              </Button>
            </div>
          </Card>

          {/* User Login */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Login User
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="Email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              />
              <Input
                placeholder="Password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              />
              <Button 
                onClick={loginUser} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                Login via Supabase
              </Button>
            </div>
          </Card>
        </div>

        {/* Users List from Neon Database */}
        <Card className="p-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users in Neon PostgreSQL ({users.length})
            </h3>
            <Button onClick={loadUsers} disabled={isLoading} variant="outline" size="sm">
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Refresh from Database
            </Button>
          </div>

          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No users found. Register some users to see them here!
            </p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                    <Badge className={user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* How It Works */}
        <Card className="p-4 mt-6 bg-blue-50">
          <h3 className="font-semibold mb-2 text-blue-800">🚀 How This Works:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• **Registration**: Creates user in Supabase Auth + saves profile data to Neon PostgreSQL</p>
            <p>• **Login**: Authenticates with Supabase + retrieves user data from Neon PostgreSQL</p>
            <p>• **Data Storage**: All application data (households, samples, etc.) stored in Neon</p>
            <p>• **Real-time**: Supabase provides real-time updates and authentication</p>
            <p>• **Logging**: All actions automatically logged in Neon database for audit trails</p>
          </div>
        </Card>
      </Card>
    </div>
  )
}
