"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, FileUp, Home, LogOut, QrCode, Settings, Shield } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden md:block w-64 border-r">
          <div className="p-4">
            <Skeleton className="h-8 w-32 mb-8" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-12 w-48 mb-8" />
            <div className="grid gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const menuItems = [
    { title: "Dashboard", icon: Home, path: "/dashboard" },
    { title: "Generate QR Codes", icon: FileUp, path: "/dashboard/generate" },
    { title: "My QR Codes", icon: QrCode, path: "/dashboard/my-codes" },
    { title: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
    { title: "Security", icon: Shield, path: "/dashboard/security" },
    { title: "Settings", icon: Settings, path: "/dashboard/settings" },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6" />
              <span className="font-bold text-xl">QR Bulk</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={pathname === item.path} tooltip={item.title}>
                    <a href={item.path}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt={user?.email} />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sign out</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1">
          <header className="border-b">
            <div className="flex h-14 items-center px-4 gap-4">
              <SidebarTrigger />
              <div className="ml-auto flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt={user?.email} />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
