"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import NetworkStatus from "@/components/network-status"
import SyncStatus from "@/components/sync-status"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Bell } from "lucide-react"
import { useNavigation } from "@/lib/navigation-context"

interface OdkTopNavProps {
  user: { name: string; role: string }
  onLogout: () => void
}

export default function OdkTopNav({ user, onLogout }: OdkTopNavProps) {
  const { navigate } = useNavigation()

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left: Welcome */}
        <div className="hidden lg:block">
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <p className="text-sm font-semibold">{user.name}</p>
        </div>

        {/* Spacer for mobile (hamburger is in sidebar layout) */}
        <div className="lg:hidden" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          <SyncStatus compact />
          <NetworkStatus className="hidden sm:flex" showText={false} />
          <ThemeToggle />

          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-medium">{user.name}</div>
              <div className="px-2 pb-1.5 text-xs text-muted-foreground">{user.role}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ view: "profile" })}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ view: "system-settings" })}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
