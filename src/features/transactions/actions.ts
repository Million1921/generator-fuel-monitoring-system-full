"use server"

import prisma from "@/lib/db"
import { requireAbility } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/server-utils"
import { z } from "zod"

export async function deleteTransaction(id: number) {
  await requireAbility("delete", "Transaction")

  try {
    await prisma.transaction.delete({
      where: { id }
    });
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    logger.error("deleteTransaction failed", { id, error: error?.message });
    throw new Error("Failed to delete transaction");
  }
}

const TransactionUpdateSchema = z.object({
  receiptNo: z.string().optional(),
  senderAccount: z.string().optional(),
  receiverAccount: z.string().optional(),
  paidAmount: z.coerce.number().nonnegative().optional(),
  senderAmount: z.coerce.number().nonnegative().optional(),
  payerName: z.string().optional(),
  location: z.string().optional(),
  fuelStation: z.string().optional(),
  fuelType: z.string().optional(),
  type: z.string().optional(),
  remark: z.string().optional(),
})

export async function updateTransaction(id: number, data: unknown) {
  await requireAbility("update", "Transaction")

  const parsed = TransactionUpdateSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(`Invalid transaction data: ${parsed.error.issues.map(i => i.message).join(", ")}`)
  }
  const validated = parsed.data

  try {
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        receiptNo: validated.receiptNo,
        senderAccount: validated.senderAccount,
        receiverAccount: validated.receiverAccount,
        paidAmount: validated.paidAmount,
        senderAmount: validated.senderAmount,
        payerName: validated.payerName,
        location: validated.location,
        fuelStation: validated.fuelStation,
        fuelType: validated.fuelType,
        type: validated.type,
        remark: validated.remark,
      }
    });
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    logger.error("updateTransaction failed", { id, error: error?.message });
    throw new Error("Failed to update transaction");
  }
}

export async function getTransactions() {
  await requireAbility("read", "Transaction")
  return await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: { site: true }
  });
}
