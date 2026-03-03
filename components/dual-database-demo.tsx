"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Cloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Eye,
  UserPlus,
  Search,
  XCircle,
  Shield,
} from "lucide-react"
import { ROLE_DEFINITIONS, type TeamRole } from "@/lib/team-roles"

interface User {
  id: string
  email: string
  fullName: string
  role: string
  regionId?: string
  districtId?: string
  phone?: string
  isActive: boolean
  employmentStatus?: string
  createdAt: string
  syncStatus?: 'pending' | 'synced' | 'error'
  source?: 'local' | 'server'
}

export default function DualDatabaseDemo() {
  const [localUsers, setLocalUsers] = useState<User[]>([])
  const [serverUsers, setServerUsers] = useState<User[]>([])
  const [serverAvailable, setServerAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Registration form state
  const [regForm, setRegForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'field_collector' as string,
    regionId: '',
    districtId: '',
  })

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Load users from IndexedDB
  const loadLocalUsers = useCallback(async () => {
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      const members = await offlineDB.getAll<any>('team_members')
      const mapped: User[] = members.map((m: any) => ({
        id: m.id,
        email: m.email || '',
        fullName: m.fullName || '',
        role: m.role || 'field_collector',
        regionId: m.regionId,
        districtId: m.districtId,
        isActive: m.isActive !== false,
        createdAt: m.createdAt,
        syncStatus: m.syncStatus || 'pending',
        source: 'local' as const,
      }))
      setLocalUsers(mapped)
    } catch (error) {
      console.error('Failed to load local users:', error)
    }
  }, [])

  // Load users from Supabase via API
  const loadServerUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users')
      if (response.status === 503) {
        setServerAvailable(false)
        return
      }
      const data = await response.json()
      if (data.success) {
        setServerAvailable(true)
        setServerUsers(data.data.map((u: any) => ({ ...u, source: 'server' })))
      }
    } catch {
      setServerAvailable(false)
    }
  }, [])

  // Create user via Supabase Auth
  const registerUser = async () => {
    if (!regForm.fullName || !regForm.email || !regForm.password) {
      showMessage('error', 'Full name, email, and password are required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      })
      const data = await response.json()

      if (data.success) {
        showMessage('success', 'User created successfully')
        setRegForm({ email: '', password: '', fullName: '', role: 'field_collector', regionId: '', districtId: '' })
        setShowAddForm(false)
        loadServerUsers()
      } else {
        showMessage('error', data.error || 'Failed to create user')
      }
    } catch (error) {
      showMessage('error', 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  // Deactivate user
  const deactivateUser = async (userId: string) => {
    try {
      // Try local first
      const { offlineDB } = await import('@/lib/offline-first-db')
      const localUser = localUsers.find(u => u.id === userId)
      if (localUser) {
        await offlineDB.update('team_members', userId, { isActive: false } as any)
        await loadLocalUsers()
      }
      showMessage('success', 'User deactivated')
    } catch {
      showMessage('error', 'Failed to deactivate user')
    }
  }

  useEffect(() => {
    loadLocalUsers()
    loadServerUsers()
  }, [loadLocalUsers, loadServerUsers])

  // Merge and deduplicate users
  const allUsers = [
    ...serverUsers.map(u => ({ ...u, source: 'server' as const })),
    ...localUsers.filter(l => !serverUsers.some(s => s.email === l.email)),
  ]

  const filteredUsers = allUsers.filter(u =>
    !searchQuery || u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const roleOptions = Object.entries(ROLE_DEFINITIONS).map(([key, def]) => ({
    value: key,
    label: def.title,
  }))

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <h2 className="text-2xl font-bold">User Management</h2>
          </div>
          <div className="flex items-center gap-2">
            {serverAvailable ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Cloud className="w-3 h-3 mr-1" /> Supabase Connected
              </Badge>
            ) : (
              <Badge variant="outline">Offline Mode</Badge>
            )}
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

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" disabled={!serverAvailable}>
            <UserPlus className="w-4 h-4 mr-1" />
            Add User
          </Button>
          <Button onClick={() => { loadLocalUsers(); loadServerUsers() }} variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <Card className="p-4 mb-4 border-2 border-primary/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Create New User (Supabase Auth)
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                placeholder="Full Name *"
                value={regForm.fullName}
                onChange={(e) => setRegForm({...regForm, fullName: e.target.value})}
              />
              <Input
                placeholder="Email *"
                type="email"
                value={regForm.email}
                onChange={(e) => setRegForm({...regForm, email: e.target.value})}
              />
              <Input
                placeholder="Password *"
                type="password"
                value={regForm.password}
                onChange={(e) => setRegForm({...regForm, password: e.target.value})}
              />
              <select
                className="w-full p-2 border rounded text-sm"
                value={regForm.role}
                onChange={(e) => setRegForm({...regForm, role: e.target.value})}
              >
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Input
                placeholder="Region"
                value={regForm.regionId}
                onChange={(e) => setRegForm({...regForm, regionId: e.target.value})}
              />
              <Input
                placeholder="District"
                value={regForm.districtId}
                onChange={(e) => setRegForm({...regForm, districtId: e.target.value})}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={registerUser} disabled={isLoading} size="sm">
                {isLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Create User
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Users List */}
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No users found. {serverAvailable ? 'Add a user to get started.' : 'Connect Supabase to manage users.'}
            </p>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.fullName}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    <Shield className="w-3 h-3 mr-1" />
                    {ROLE_DEFINITIONS[user.role as TeamRole]?.title || user.role.replace('_', ' ')}
                  </Badge>
                  {user.source === 'server' && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                      <Cloud className="w-3 h-3 mr-1" />Cloud
                    </Badge>
                  )}
                  {!user.isActive && (
                    <Badge className="bg-gray-100 text-gray-500 text-xs">Inactive</Badge>
                  )}
                  {user.isActive && user.source === 'local' && (
                    <Button
                      onClick={() => deactivateUser(user.id)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
