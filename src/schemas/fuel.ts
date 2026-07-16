/**
 * Zod validation schemas for fuel request and delivery forms.
 * Exported TypeScript types are derived via `z.infer` for type‑safe usage
 * throughout the application.
 */
import { z } from "zod";

export const FuelRequestFormSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  department: z.string().optional(),
  requestedForId: z.string().min(1, "Requested For ID is required"),
  priority: z.string().default("ROUTINE"),
  requestDescription: z.string().optional(),
  additionalDescription: z.string().optional(),
  notifyUser: z.boolean().default(true),
  requesterEmail: z.string().email("Invalid email").default("million.tesfahun@ethiotelecom.et"),
  requesterPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  contactPreference: z.enum(["email", "phone"]).default("email"),
  driverName: z.string().optional(),
  /**
   * Type of driver. Defaults to "employee".
   */
  driverType: z.string().default("employee"),
  technicianId: z.string().optional(),
  literRequired: z.coerce.number().positive("Liters required must be greater than 0"),
  remark: z.string().optional(),
  runningHour: z.coerce.number().optional(),
  securityName: z.string().optional(),
  route: z.string().optional(),
  driverPhone: z.string().optional(),
  employeeId: z.string().optional(),
});

/**
 * Type representing the validated values of the fuel request form.
 */
export type FuelRequestFormValues = z.infer<typeof FuelRequestFormSchema>;

export const FuelDeliveryFormSchema = z.object({
  requestId: z.string().optional(),
  siteId: z.string().min(1, "Site is required"),
  workOrderNumber: z.string().min(1, "Work Order Number is required"),
  begRunningHour: z.coerce.number().min(0, "Hours cannot be negative"),
  endRunningHour: z.coerce.number().min(0, "Hours cannot be negative"),
  fuelBeforeRefuel: z.coerce.number().min(0, "Fuel before refill cannot be negative"),
  actualRefueled: z.coerce.number().positive("Actual refueled must be greater than 0"),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
  guardName: z.string().optional(),
  guardSource: z.string().optional(),
}).refine((data) => data.endRunningHour >= data.begRunningHour, {
  message: "End hours cannot be less than start hours",
  path: ["endRunningHour"],
});

/**
 * Type representing the validated values of the fuel delivery form.
 */
export type FuelDeliveryFormValues = z.infer<typeof FuelDeliveryFormSchema>;
