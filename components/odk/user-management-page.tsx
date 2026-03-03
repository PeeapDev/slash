"use client"

import WebUsersTab from "./web-users-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function UserManagementPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>

      <Tabs defaultValue="web-users">
        <TabsList>
          <TabsTrigger value="web-users">Web Users</TabsTrigger>
        </TabsList>
        <TabsContent value="web-users" className="mt-4">
          <WebUsersTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
