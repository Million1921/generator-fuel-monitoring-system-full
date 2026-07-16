import { currentUser } from "@clerk/nextjs/server"
import { getRoleFromClerk } from "@/lib/auth"
import { AdminDashboard } from "@/features/dashboard/admin-dashboard"
import { ManagerDashboard } from "@/features/dashboard/manager-dashboard"
import { TechnicianDashboard } from "@/features/dashboard/technician-dashboard"
import { SupervisorDashboard } from "@/features/dashboard/supervisor-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage(props: { searchParams: Promise<{ region?: string, page?: string }> }) {
  const searchParams = await props.searchParams
  const region = searchParams.region
  const topSitesPage = parseInt(searchParams.page || "1")

  const role = await getRoleFromClerk()

  if (role === "TECHNICIAN") {
    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null
    return <TechnicianDashboard email={email} />
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

  // FINANCE and any other/unrecognized role fall back to the Manager overview
  return <ManagerDashboard region={region} topSitesPage={topSitesPage} />
}
