import { currentUser } from "@clerk/nextjs/server"
import { getRoleFromClerk, getRegionScope } from "@/lib/auth"
import { AdminDashboard } from "@/features/dashboard/admin-dashboard"
import { ManagerDashboard } from "@/features/dashboard/manager-dashboard"
import { TechnicianDashboard } from "@/features/dashboard/technician-dashboard"
import { SupervisorDashboard } from "@/features/dashboard/supervisor-dashboard"
import { FuelAdminDashboard } from "@/features/dashboard/fuel-admin-dashboard"
import { FinanceDashboard } from "@/features/dashboard/finance-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage(props: { searchParams: Promise<{ region?: string, page?: string }> }) {
  const searchParams = await props.searchParams
  const role = await getRoleFromClerk()
  const regionScope = await getRegionScope(role)
  const region = regionScope ?? searchParams.region
  
  const topSitesPage = parseInt(searchParams.page || "1")

  if (role === "TECHNICIAN") {
    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null
    const name = user?.fullName || user?.firstName || email?.split('@')[0] || "Technician"
    return <TechnicianDashboard email={email} userId={user?.id} name={name} />
  }

  if (role === "SUPERVISOR") {
    return <SupervisorDashboard region={region} />
  }

  if (role === "ADMIN") {
    return <AdminDashboard region={region} />
  }

  if (role === "MANAGER") {
    return <ManagerDashboard region={region} topSitesPage={topSitesPage} />
  }

  if (role === "FLEET_ADMIN") {
    const user = await currentUser()
    return <FuelAdminDashboard userId={user?.id || ""} region={region} />
  }

  if (role === "FINANCE") {
    return <FinanceDashboard region={region} />
  }

  // Any other/unrecognized role falls back to the Manager overview
  return <ManagerDashboard region={region} topSitesPage={topSitesPage} />
}
