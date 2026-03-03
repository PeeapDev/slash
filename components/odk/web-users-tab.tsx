"use client"

import { useState, useEffect, useCallback } from "react"
import { odkStore, type OdkWebUser, type OdkSiteRole } from "@/lib/odk-store"
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
import { Plus, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react"
import { format } from "date-fns"

export default function WebUsersTab() {
  const [users, setUsers] = useState<OdkWebUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<OdkWebUser | null>(null)

  // Form state
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [siteRole, setSiteRole] = useState<OdkSiteRole>("none")

  const load = useCallback(async () => {
    setLoading(true)
    const all = await odkStore.getWebUsers()
    setUsers(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setEmail("")
    setDisplayName("")
    setSiteRole("none")
  }

  const handleCreate = async () => {
    if (!email.trim() || !displayName.trim()) return
    await odkStore.createWebUser(email.trim(), displayName.trim(), siteRole)
    resetForm()
    setCreateOpen(false)
    load()
  }

  const handleEdit = async () => {
    if (!editUser || !email.trim() || !displayName.trim()) return
    await odkStore.updateWebUser(editUser.id, {
      email: email.trim(),
      displayName: displayName.trim(),
      siteRole,
    })
    resetForm()
    setEditUser(null)
    load()
  }

  const handleDelete = async (id: string) => {
    await odkStore.deleteWebUser(id)
    load()
  }

  const openEdit = (u: OdkWebUser) => {
    setEmail(u.email)
    setDisplayName(u.displayName)
    setSiteRole(u.siteRole)
    setEditUser(u)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Web Users</h2>
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
      ) : users.length === 0 ? (
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
                <TableHead className="w-32">Site-wide Role</TableHead>
                <TableHead className="hidden md:table-cell w-32">Created</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.siteRole === "admin" ? "default" : "secondary"}>
                      {u.siteRole === "admin" ? "Admin" : "None"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {format(new Date(u.createdAt), "MMM d, yyyy")}
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
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(u.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Retire
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
              <Label>Site-wide Role</Label>
              <Select value={siteRole} onValueChange={(v) => setSiteRole(v as OdkSiteRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
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
              disabled={!email.trim() || !displayName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Web User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Site-wide Role</Label>
              <Select value={siteRole} onValueChange={(v) => setSiteRole(v as OdkSiteRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!email.trim() || !displayName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
