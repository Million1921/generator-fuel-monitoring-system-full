import { requireRole } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";
import { UserManagementTable, UserRow } from "@/features/users/components/UserManagementTable";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireRole(["ADMIN"]);

  const client = await clerkClient();
  const response = await client.users.getUserList({
    limit: 100,
  });

  const users: UserRow[] = response.data.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.emailAddresses[0]?.emailAddress ?? "",
    role: (u.publicMetadata?.role as string) ?? "GUEST",
    region: (u.publicMetadata?.region as string) ?? null,
  }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Assign system roles and regional access for supervisors, managers, and technicians.
        </p>
      </div>

      <UserManagementTable initialUsers={users} />
    </div>
  );
}
