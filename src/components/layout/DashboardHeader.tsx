"use client"

import * as React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { RegionFilter } from "@/components/ui/RegionFilter"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, Bell, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useUser, useAuth, useClerk } from "@clerk/nextjs"
import { toast } from "sonner"
import { usePathname } from "next/navigation"
import { useAppRole } from "@/components/providers/role-provider"

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/sites": "Sites",
  "/dashboard/technicians": "Field Engineers",
  "/dashboard/generators": "Generators",
  "/dashboard/fuel-delivery": "Fuel Delivery",
  "/dashboard/transactions": "Transactions",
  "/dashboard/fuel-journal": "Generator Fuel Journal",
  "/dashboard/history/fuel-usage": "Fuel Usage History",
  "/dashboard/fuel-delivery/create": "Record Delivery",
  "/dashboard/fuel-request": "Fuel Requests",
  "/dashboard/fuel-request/new": "New Fuel Request",
}

interface DashboardHeaderProps {
  breadcrumbs?: {
    label: string
    href?: string
    isPage?: boolean
  }[]
  showRegionFilter?: boolean
}

import { SearchInput } from "@/components/ui/SearchInput"

const SEARCH_PLACEHOLDERS: Record<string, string> = {}

export function DashboardHeader({ breadcrumbs, showRegionFilter }: DashboardHeaderProps) {
  const { setTheme } = useTheme()
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useAuth()
  const { openUserProfile } = useClerk()
  
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentTitle = breadcrumbs?.[breadcrumbs.length - 1]?.label || ROUTE_LABELS[pathname] || "Dashboard"
  const isOverview = pathname === "/dashboard"
  
  // Auto-determine showRegionFilter if not provided
  const hiddenFilterPages = ["/dashboard", "/dashboard/fuel-delivery", "/dashboard/fuel-requests", "/dashboard/fuel-request", "/dashboard/generators", "/dashboard/technicians", "/dashboard/sites", "/dashboard/transactions"]
  const shouldShowRegionFilter = showRegionFilter ?? !hiddenFilterPages.includes(pathname)
  
  const searchPlaceholder = SEARCH_PLACEHOLDERS[pathname]

  const userName = user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || "User"
  const userRole = useAppRole()
  const initials = userName.split('.').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-6 transition-[width,height] ease-linear px-6 bg-white dark:bg-neutral-950 sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-md hidden md:block">
        {searchPlaceholder && (
          <SearchInput placeholder={searchPlaceholder} />
        )}
      </div>

      <div className="flex items-center gap-6">
        {shouldShowRegionFilter && <RegionFilter />}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 p-2 rounded-xl transition-colors">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">
                  {mounted ? userName : "User"}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-tighter">
                  {mounted ? userRole.replace('_', ' ') : "Loading..."}
                </span>
              </div>
              <Avatar className="h-10 w-10 border-2 border-lime-500/20">
                <AvatarImage src={user?.imageUrl || ""} alt={userName} />
                <AvatarFallback className="bg-lime-500 text-white font-bold">
                  {mounted ? initials : "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onSelect={() => openUserProfile()}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onSelect={() => toast.info("Settings feature coming soon")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="mr-2 h-4 w-4" />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuItem className="cursor-pointer" onSelect={() => toast.info("Notifications coming soon")}>
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 cursor-pointer" 
              onSelect={async (e) => {
                e.preventDefault();
                await signOut();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
