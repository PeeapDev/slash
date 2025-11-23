"use client"

import { Card } from "@/components/ui/card"

export default function UserProfile({ user }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Admin / User Profile</div>
        <h1 className="text-2xl font-bold mt-1">My Profile</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Role</label>
            <p className="font-medium capitalize">{user?.role?.replace(/_/g, " ")}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
