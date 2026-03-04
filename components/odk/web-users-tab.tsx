"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreHorizontal, Pencil, Users, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ROLE_DEFINITIONS, type TeamRole, getRoleColor } from "@/lib/team-roles"

interface WebUser {
  id: string
  email: string
  fullName: string
  role: TeamRole
  regionId?: string
  districtId?: string
  isActive: boolean
  employmentStatus?: string
  createdAt: string
}

interface WebUsersTabProps {
  filterRoles?: TeamRole[]
}

export default function WebUsersTab({ filterRoles }: WebUsersTabProps) {
  const [users, setUsers] = useState<WebUser[]>([])
  const [loading, setLoading] = useState(true)
  const [serverAvailable, setServerAvailable] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<WebUser | null>(null)

  // Form state
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<TeamRole>(filterRoles?.[0] || "field_collector")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      if (response.status === 503) {
        setServerAvailable(false)
        setLoading(false)
        return
      }
      const data = await response.json()
      if (data.success) {
        setServerAvailable(true)
        setUsers(data.data.sort((a: WebUser, b: WebUser) => b.createdAt.localeCompare(a.createdAt)))
      }
    } catch {
      setServerAvailable(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setEmail("")
    setDisplayName("")
    setPassword("")
    setRole("field_collector")
  }

  const handleCreate = async () => {
    if (!email.trim() || !displayName.trim() || !password.trim()) return

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          fullName: displayName.trim(),
          password: password.trim(),
          role,
        }),
      })
      const data = await response.json()
      if (data.success) {
        resetForm()
        setCreateOpen(false)
        load()
      }
    } catch (e) {
      console.error('Failed to create user:', e)
    }
  }

  const openEdit = (u: WebUser) => {
    setEmail(u.email)
    setDisplayName(u.fullName)
    setRole(u.role)
    setEditUser(u)
  }

  const roleOptions = Object.entries(ROLE_DEFINITIONS)
    .filter(([key]) => !filterRoles || filterRoles.includes(key as TeamRole))
    .map(([key, def]) => ({
      value: key as TeamRole,
      label: def.title,
    }))

  const displayUsers = filterRoles
    ? users.filter(u => filterRoles.includes(u.role))
    : users

  if (!serverAvailable && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          Supabase not configured. User management requires a cloud connection.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{displayUsers.length} total</div>
        <Button
          size="sm"
          onClick={() => {
            resetForm()
            setCreateOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Web User
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : displayUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No web users yet.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-40">Role</TableHead>
                <TableHead className="hidden md:table-cell w-24">Status</TableHead>
                <TableHead className="hidden md:table-cell w-32">Created</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${getRoleColor(u.role)}`} />
                      <span className="text-sm">{ROLE_DEFINITIONS[u.role]?.title || u.role}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={u.isActive ? "default" : "secondary"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(u)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Web User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input
                placeholder="Jane Smith"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!email.trim() || !displayName.trim() || !password.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-3 py-2 text-sm">
              <div><span className="font-medium">Name:</span> {editUser.fullName}</div>
              <div><span className="font-medium">Email:</span> {editUser.email}</div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Role:</span>
                <div className={`w-2 h-2 rounded-full ${getRoleColor(editUser.role)}`} />
                {ROLE_DEFINITIONS[editUser.role]?.title || editUser.role}
              </div>
              <div><span className="font-medium">Status:</span> {editUser.isActive ? 'Active' : 'Inactive'}</div>
              {editUser.regionId && <div><span className="font-medium">Region:</span> {editUser.regionId}</div>}
              {editUser.districtId && <div><span className="font-medium">District:</span> {editUser.districtId}</div>}
              <div><span className="font-medium">Created:</span> {editUser.createdAt ? format(new Date(editUser.createdAt), "PPP") : '-'}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
