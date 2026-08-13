"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADDIS_ABABA_REGIONS, OUTSIDE_ADDIS_REGIONS } from "@/lib/constants";
import { AppRole } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export type UserRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  region: string | null;
};

const ROLES: AppRole[] = [
  "ADMIN",
  "MANAGER",
  "SUPERVISOR",
  "FUEL_SUPERVISOR",
  "FLEET_MANAGER",
  "FL_COUNTRY_MANAGER",
  "FLEET_ADMIN",
  "TECHNICIAN",
  "GUEST",
];

export function UserManagementTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  const handleUpdate = async (userId: string, field: "role" | "region", value: string | null) => {
    setUpdatingId(userId);
    try {
      const payload: Record<string, any> = {};
      
      if (field === "role") {
        payload.role = value;
      } else {
        payload.region = value === "UNASSIGNED" ? null : value;
      }

      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to update user");
      }

      const data = await res.json();
      
      setUsers(current => 
        current.map(u => u.id === userId ? { ...u, role: data.role || u.role, region: data.region } : u)
      );

      toast.success("User updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update user");
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Region</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.firstName || user.lastName 
                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim() 
                  : "No Name"}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Select
                  disabled={updatingId === user.id}
                  value={user.role}
                  onValueChange={(val) => handleUpdate(user.id, "role", val)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  disabled={updatingId === user.id}
                  value={user.region || "UNASSIGNED"}
                  onValueChange={(val) => handleUpdate(user.id, "region", val)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNASSIGNED" className="text-muted-foreground italic">
                      Unassigned
                    </SelectItem>
                    <SelectGroup>
                      <SelectLabel>Addis Ababa</SelectLabel>
                      {ADDIS_ABABA_REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Outside Addis Ababa</SelectLabel>
                      {OUTSIDE_ADDIS_REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {updatingId === user.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
