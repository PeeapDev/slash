"use client"

import { useState, useEffect, useCallback } from "react"
import { odkStore, type OdkAppUser } from "@/lib/odk-store"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, QrCode, Ban, Users } from "lucide-react"
import { format } from "date-fns"

export default function ProjectAppUsersTab({ projectId }: { projectId: string }) {
  const [users, setUsers] = useState<OdkAppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [qrUser, setQrUser] = useState<OdkAppUser | null>(null)
  const [revokeUser, setRevokeUser] = useState<OdkAppUser | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await odkStore.getAppUsers(projectId)
    setUsers(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!displayName.trim()) return
    await odkStore.createAppUser(projectId, displayName.trim())
    setDisplayName("")
    setCreateOpen(false)
    load()
  }

  const handleRevoke = async () => {
    if (!revokeUser) return
    await odkStore.revokeAppUser(revokeUser.id)
    setRevokeUser(null)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">App Users</h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create App User
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No app users yet. Create one to allow mobile data collection.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.displayName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {format(new Date(u.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "active" ? "default" : "destructive"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Show QR Code"
                        onClick={() => setQrUser(u)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      {u.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Revoke"
                          onClick={() => setRevokeUser(u)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create App User</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="app-user-name">Display Name *</Label>
            <Input
              id="app-user-name"
              placeholder="e.g. Field Tablet 3"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!displayName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrUser} onOpenChange={() => setQrUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>App User Token</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
              <QrCode className="h-20 w-20 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              QR code placeholder — scan with ODK Collect
            </p>
            <code className="block text-xs bg-muted p-2 rounded break-all">
              {qrUser?.token}
            </code>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeUser} onOpenChange={() => setRevokeUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke App User</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately prevent &quot;{revokeUser?.displayName}&quot; from
              submitting new data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke}>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
