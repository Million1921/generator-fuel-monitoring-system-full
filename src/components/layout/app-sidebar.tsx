"use client"
import * as React from "react"
import {
  LayoutDashboard,
  MapPin,
  Map,
  Fuel,
  FileText,
  BarChart2,
  History,
  Zap,
  Users,
  ArrowRightLeft,
  BarChart3,
} from "lucide-react"
import { NavMain } from "@/components/layout/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { useUser } from "@clerk/nextjs"
import { FuelRequestSheet } from "@/features/fuel-requests/components/fuel-request-sheet"
import { useAppRole } from "@/components/providers/role-provider"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  const userRole = useAppRole()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
      roles: ["ADMIN", "TECHNICIAN", "MANAGER", "SUPERVISOR", "FUEL_SUPERVISOR", "FL_COUNTRY_MANAGER", "FLEET_MANAGER", "FLEET_ADMIN"]
    },
    {
      title: "Sites",
      url: "/dashboard/sites",
      icon: MapPin,
      items: [],
      roles: ["ADMIN"]
    },
    {
      title: "Site Map",
      url: "/dashboard/site-map",
      icon: Map,
      items: [],
      roles: ["ADMIN", "MANAGER", "SUPERVISOR", "TECHNICIAN", "FUEL_SUPERVISOR", "FL_COUNTRY_MANAGER", "FLEET_MANAGER", "FLEET_ADMIN"]
    },
    {
      title: "User Management",
      url: "/dashboard/users",
      icon: Users,
      roles: ["ADMIN"]
    },
    {
      title: "Generators",
      url: "/dashboard/generators",
      icon: Zap,
      items: [],
      roles: ["ADMIN"]
    },
    {
      title: "Fuel Requests",
      url: "/dashboard/fuel-request",
      icon: FileText,
      items: [],
      roles: ["ADMIN", "MANAGER", "SUPERVISOR", "TECHNICIAN", "FUEL_SUPERVISOR", "FL_COUNTRY_MANAGER", "FLEET_MANAGER", "FLEET_ADMIN"]
    },
    {
      title: "Fuel Delivery",
      url: "/dashboard/fuel-delivery",
      icon: Fuel,
      items: [],
      roles: ["ADMIN", "TECHNICIAN", "SUPERVISOR", "MANAGER", "FLEET_ADMIN"]
    },
    {
      title: "Transactions",
      url: "/dashboard/transactions",
      icon: ArrowRightLeft,
      items: [],
      roles: ["ADMIN", "MANAGER", "FL_COUNTRY_MANAGER", "FLEET_MANAGER"]
    },
    {
      title: "Generator Fuel Journal",
      url: "/dashboard/fuel-journal",
      icon: BarChart2,
      roles: ["ADMIN", "MANAGER", "SUPERVISOR", "TECHNICIAN", "FUEL_SUPERVISOR", "FL_COUNTRY_MANAGER", "FLEET_MANAGER", "FLEET_ADMIN"]
    },
    {
      title: "Fuel Usage History",
      url: "/dashboard/history/fuel-usage",
      icon: History,
      roles: ["ADMIN", "MANAGER"]
    },
    {
      title: "Fuel Analytics",
      url: "/dashboard/analytics",
      icon: BarChart3,
      roles: ["ADMIN", "FLEET_ADMIN"]
    }
  ]

  const filteredNav = navMain.filter(item => 
    !item.roles || item.roles.includes(userRole)
  )

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="/dashboard">
                  <div className="flex items-center justify-center rounded-lg">
                    <img src="/ethio_logo_full.png" alt="ethio telecom" className="h-10 w-auto object-contain" />
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={filteredNav} />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      
      {/* Unified Request Sheet globally available from Sidebar */}
      <FuelRequestSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
