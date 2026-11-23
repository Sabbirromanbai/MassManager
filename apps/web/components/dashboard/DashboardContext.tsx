"use client";

import { createContext, useContext, ReactNode } from "react";
import type { PublicMemberView } from "@/lib/memberView";
import { Lang } from "@/lib/lang";

interface DashboardContextValue {
  userName: string;
  isManager: boolean;
  allMembers: PublicMemberView[];
  currentMember: PublicMemberView | null;
  lang: Lang;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DashboardContextValue;
}) {
  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}