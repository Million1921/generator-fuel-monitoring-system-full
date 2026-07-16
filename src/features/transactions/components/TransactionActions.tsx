"use client"

import React, { useState } from "react"
import { MoreVertical, Eye, Edit2, Trash2, Fuel } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { toast } from "sonner"
import { deleteTransaction, updateTransaction } from "../actions"
import { useRouter } from "next/navigation"

export function TransactionActions({ transaction }: { transaction: any }) {
  const router = useRouter()
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
      try {
        await deleteTransaction(transaction.id)
        toast.success("Transaction deleted successfully")
      } catch (err: any) {
        toast.error(`Deletion failed: ${err.message}`)
      }
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    const data = {
      receiptNo: formData.get("receiptNo") as string,
      senderAccount: formData.get("senderAccount") as string,
      receiverAccount: formData.get("receiverAccount") as string,
      paidAmount: formData.get("paidAmount") as string,
      senderAmount: formData.get("senderAmount") as string,
      payerName: formData.get("payerName") as string,
      location: formData.get("location") as string,
      fuelStation: formData.get("fuelStation") as string,
      fuelType: formData.get("fuelType") as string,
      type: formData.get("type") as string,
      remark: formData.get("remark") as string,
    }

    try {
      await updateTransaction(transaction.id, data)
      toast.success("Transaction updated successfully")
      setIsEditOpen(false)
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-lime-600">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsViewOpen(true)} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4 text-lime-600" /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
            <Edit2 className="mr-2 h-4 w-4 text-orange-500" /> Edit Record
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(`/dashboard/fuel-delivery/create?tx=${transaction.id}`)} className="cursor-pointer bg-lime-50 text-lime-700 hover:bg-lime-100 focus:text-lime-800">
            <Fuel className="mr-2 h-4 w-4" /> Create Delivery
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
               <div><span className="text-gray-500 font-semibold text-xs uppercase">Receipt No</span><p className="font-medium">{transaction.receiptNo || "N/A"}</p></div>
               <div><span className="text-gray-500 font-semibold text-xs uppercase">Date</span><p className="font-medium">{format(new Date(transaction.createdAt), "PPp")}</p></div>
               <div><span className="text-gray-500 font-semibold text-xs uppercase">Paid Amount</span><p className="font-bold text-lg text-lime-600">{transaction.paidAmount?.toLocaleString() || "N/A"}</p></div>
               <div><span className="text-gray-500 font-semibold text-xs uppercase">Sender Amount</span><p className="font-bold text-lg text-lime-600">{transaction.senderAmount?.toLocaleString() || "N/A"}</p></div>
               <div><span className="text-gray-500 font-semibold text-xs uppercase">Sender A/c</span><p className="font-medium">{transaction.senderAccount || "N/A"}</p></div>
               <div><span className="text-gray-500 font-semibold text-xs uppercase">Receiver A/c</span><p className="font-medium">{transaction.receiverAccount || "N/A"}</p></div>
               <div><span className="text-gray-500 font-semibold text-xs uppercase">Payer Name</span><p className="font-medium">{transaction.payerName || "N/A"}</p></div>
               <div><span className="text-gray-500 font-semibold text-xs uppercase">Location</span><p className="font-medium">{transaction.location || "N/A"}</p></div>
               <div><span className="text-gray-500 font-semibold text-xs uppercase">Station</span><p className="font-medium">{transaction.fuelStation || "N/A"}</p></div>
               <div><span className="text-gray-500 font-semibold text-xs uppercase">Type</span><p className="font-medium uppercase tracking-tight">{transaction.type}</p></div>
            </div>
            {transaction.remark && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-semibold text-xs uppercase">Remark</span>
                <p className="text-gray-700 mt-1">{transaction.remark}</p>
              </div>
            )}
          </div>
          <DialogFooter>
             <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction #{transaction.receiptNo || transaction.id}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receiptNo">Receipt No.</Label>
                  <Input id="receiptNo" name="receiptNo" defaultValue={transaction.receiptNo || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Transaction Type</Label>
                  <Input id="type" name="type" required defaultValue={transaction.type || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paidAmount">Paid Amount</Label>
                  <Input id="paidAmount" name="paidAmount" type="number" step="0.01" defaultValue={transaction.paidAmount || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderAmount">Sender Amount</Label>
                  <Input id="senderAmount" name="senderAmount" type="number" step="0.01" defaultValue={transaction.senderAmount || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderAccount">Sender Account</Label>
                  <Input id="senderAccount" name="senderAccount" defaultValue={transaction.senderAccount || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiverAccount">Receiver Account</Label>
                  <Input id="receiverAccount" name="receiverAccount" defaultValue={transaction.receiverAccount || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payerName">Payer Name</Label>
                  <Input id="payerName" name="payerName" defaultValue={transaction.payerName || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelStation">Fuel Station</Label>
                  <Input id="fuelStation" name="fuelStation" defaultValue={transaction.fuelStation || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" defaultValue={transaction.location || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Input id="fuelType" name="fuelType" defaultValue={transaction.fuelType || "Diesel"} />
                </div>
             </div>
             <div className="space-y-2">
               <Label htmlFor="remark">Remark</Label>
               <Input id="remark" name="remark" defaultValue={transaction.remark || ""} />
             </div>
             
             <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
               <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
