import prisma from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { FuelAnalyticsTable, AnalyticsRow } from "@/features/fuel-requests/components/FuelAnalyticsTable"
import { clerkClient } from "@clerk/nextjs/server"
import { BarChart3 } from "lucide-react"
import { SearchInput } from "@/components/ui/SearchInput"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage(props: {
  searchParams: Promise<{
    search?: string;
  }>
}) {
  await requireRole(["ADMIN", "FLEET_ADMIN"]);
  
  const searchParams = await props.searchParams;
  const search = searchParams.search;

  // Fetch clerk users to find Fleet Admins and their account numbers
  const clerk = await clerkClient();
  const allUsers = await clerk.users.getUserList({ limit: 200 });
  const fleetAdminAccounts: string[] = [];
  
  allUsers.data.forEach(u => {
    if (u.publicMetadata?.role === "FLEET_ADMIN" && u.publicMetadata?.accountNumber) {
      fleetAdminAccounts.push(u.publicMetadata.accountNumber as string);
    }
  });
  
  // Use the first found Fleet Admin account as a fallback, or N/A
  const defaultFleetAdminAccount = fleetAdminAccounts.length > 0 ? fleetAdminAccounts[0] : "N/A";

  const whereBase: any = {
    fuelRequest: {
      isNot: null,
      status: "COMPLETED"
    }
  };

  if (search) {
    whereBase.OR = [
      { site: { name: { contains: search, mode: 'insensitive' } } },
      { site: { siteId: { contains: search, mode: 'insensitive' } } },
      { workOrderNumber: { contains: search, mode: 'insensitive' } },
      { fuelRequest: { workRequestNumber: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Fetch refills which are basically completed fuelings
  const refills = await prisma.fuelRefill.findMany({
    where: whereBase,
    include: {
      site: {
        include: {
          generator: true
        }
      },
      fuelRequest: true,
      technician: true
    },
    orderBy: { refillDate: 'desc' },
    take: 100 // Limit for performance, can add pagination later
  });

  const data: AnalyticsRow[] = refills.map((refill) => {
    const diffHours = refill.afterHours - refill.beforeHours;
    const diffFuel = refill.afterLevel - refill.beforeLevel;
    const stdConsumption = refill.site.generator?.stdFuelConsumption || 0;
    const capacity = refill.site.tankerCapacity || 0;
    
    let actualConsumption = 0;
    if (diffHours > 0) {
      actualConsumption = diffFuel / diffHours;
    }

    let status: AnalyticsRow["status"] = "NORMAL";

    if (diffHours < 0 || diffFuel < 0 || actualConsumption === 0) {
      status = "ABNORMAL";
    } else if (capacity > 0 && refill.afterLevel > capacity) {
      status = "OVERFILL";
    } else if (stdConsumption > 0) {
      // 5% tolerance
      const tolerance = stdConsumption * 0.05;
      if (actualConsumption > stdConsumption + tolerance) {
        status = "ABOVE";
      } else if (actualConsumption < stdConsumption - tolerance) {
        status = "BELOW";
      }
    }

    return {
      id: refill.id.toString(),
      transactionId: `TRX-${refill.id.toString().padStart(5, '0')}`,
      mobileNo: refill.fuelRequest?.driverPhone || refill.technician?.phone || "",
      workRequest: refill.fuelRequest?.workRequestNumber || "",
      workOrder: refill.workOrderNumber || refill.fuelRequest?.workOrderNumber || "",
      siteId: refill.site.siteId,
      siteName: refill.site.name,
      generatorType: refill.site.dgType || refill.site.generator?.model || "",
      generatorCapacity: refill.site.dgCapacity || refill.site.generator?.capacityKVA?.toString() || "0",
      stdConsumption,
      beforeHour: refill.beforeHours,
      endHour: refill.afterHours,
      hourDiff: diffHours,
      beforeFuel: refill.beforeLevel,
      afterFuel: refill.afterLevel,
      fuelDiff: diffFuel,
      actualConsumption,
      status,
      location: refill.site.region || refill.fuelRequest?.route || "",
      fuelPrice: refill.unitPrice || 0,
      fleetAdminAccount: defaultFleetAdminAccount,
      assetType: "Generator",
      date: refill.refillDate
    };
  });

  return (
    <div className="flex flex-1 flex-col p-6 gap-6 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Fuel Consumption Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor actual vs standard generator fuel consumption and detect anomalies.
          </p>
        </div>
        <div className="w-72">
          <SearchInput placeholder="Search site, WR, WO..." />
        </div>
      </div>
      
      <div className="flex-1 min-h-[500px]">
        <FuelAnalyticsTable data={data} />
      </div>
    </div>
  );
}
