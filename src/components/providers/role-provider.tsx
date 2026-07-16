"use client"

import React, { createContext, useContext } from "react"
import { AppRole } from "@/lib/auth"

const RoleContext = createContext<AppRole>("TECHNICIAN")

export function RoleProvider({
  role,
  children,
}: {
  role: AppRole
  children: React.ReactNode
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export function useAppRole() {
  return useContext(RoleContext)
}
