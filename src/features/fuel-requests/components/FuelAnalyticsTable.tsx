"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export type AnalyticsRow = {
  id: string;
  transactionId: string;
  mobileNo: string;
  workRequest: string;
  workOrder: string;
  siteId: string;
  siteName: string;
  generatorType: string;
  generatorCapacity: string;
  stdConsumption: number;
  beforeHour: number;
  endHour: number;
  hourDiff: number;
  beforeFuel: number;
  afterFuel: number;
  fuelDiff: number;
  status: "NORMAL" | "ABOVE" | "BELOW" | "OVERFILL" | "ABNORMAL";
  location: string;
  fuelPrice: number;
  fleetAdminAccount: string;
  assetType: string;
  date: Date;
  actualConsumption: number;
};

export function FuelAnalyticsTable({ data }: { data: AnalyticsRow[] }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NORMAL":
        return <Badge className="bg-green-500">NORMAL</Badge>;
      case "ABOVE":
        return <Badge className="bg-yellow-500">ABOVE</Badge>;
      case "BELOW":
        return <Badge className="bg-blue-500">BELOW</Badge>;
      case "OVERFILL":
        return <Badge className="bg-purple-500">OVERFILL</Badge>;
      case "ABNORMAL":
      default:
        return <Badge className="bg-red-500">ABNORMAL</Badge>;
    }
  };

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden flex flex-col h-full">
      <div className="overflow-auto max-h-[70vh]">
        <Table className="relative w-full whitespace-nowrap">
          <TableHeader className="sticky top-0 bg-slate-100 z-10">
            <TableRow>
              <TableHead className="w-[50px]">No.</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Mobile No.</TableHead>
              <TableHead>Work Request</TableHead>
              <TableHead>Work Order</TableHead>
              <TableHead>Site ID</TableHead>
              <TableHead>Site Name</TableHead>
              <TableHead>Generator Type</TableHead>
              <TableHead>Capacity (kVA)</TableHead>
              <TableHead>Std. Consumption (L/hr)</TableHead>
              <TableHead>Before Hour</TableHead>
              <TableHead>End Hour</TableHead>
              <TableHead>Hour Diff.</TableHead>
              <TableHead>Before Fuel (L)</TableHead>
              <TableHead>After Fuel (L)</TableHead>
              <TableHead>Fuel Diff. (L)</TableHead>
              <TableHead>Actual (L/hr)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Fuel Price (ETB)</TableHead>
              <TableHead>Fleet Account</TableHead>
              <TableHead>Asset Type</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={23} className="h-24 text-center">
                  No consumption data found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium text-slate-700">{row.transactionId}</TableCell>
                  <TableCell>{row.mobileNo || "N/A"}</TableCell>
                  <TableCell>{row.workRequest || "N/A"}</TableCell>
                  <TableCell>{row.workOrder || "N/A"}</TableCell>
                  <TableCell>{row.siteId}</TableCell>
                  <TableCell>{row.siteName}</TableCell>
                  <TableCell>{row.generatorType || "N/A"}</TableCell>
                  <TableCell>{row.generatorCapacity || "0"}</TableCell>
                  <TableCell>{row.stdConsumption.toFixed(2)}</TableCell>
                  <TableCell>{row.beforeHour.toFixed(1)}</TableCell>
                  <TableCell>{row.endHour.toFixed(1)}</TableCell>
                  <TableCell>{row.hourDiff.toFixed(1)}</TableCell>
                  <TableCell>{row.beforeFuel.toFixed(1)}</TableCell>
                  <TableCell>{row.afterFuel.toFixed(1)}</TableCell>
                  <TableCell className="font-medium">{row.fuelDiff.toFixed(1)}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{row.actualConsumption.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(row.status)}</TableCell>
                  <TableCell>{row.location || "N/A"}</TableCell>
                  <TableCell>{row.fuelPrice.toFixed(2)}</TableCell>
                  <TableCell>{row.fleetAdminAccount || "N/A"}</TableCell>
                  <TableCell>{row.assetType}</TableCell>
                  <TableCell>{format(new Date(row.date), "dd/MM/yyyy")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
