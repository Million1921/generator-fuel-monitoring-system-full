import { AppSidebar } from "@/components/layout/app-sidebar"
import { DashboardHeader } from "@/components/layout/DashboardHeader"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getRoleFromClerk } from "@/lib/auth"
import { RoleProvider } from "@/components/providers/role-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const role = await getRoleFromClerk()

  return (
    <RoleProvider role={role}>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <DashboardHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </RoleProvider>
  )
}

