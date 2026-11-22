"use client";

import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardMobileNav } from "./DashboardMobileNav";
import { Member } from "@/lib/models";

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  userName: string;
  isManager: boolean;
  allMembers: Member[];
  currentMember: Member | null;
}

export function DashboardClientLayout({
  children,
  userName,
  isManager,
  allMembers,
  currentMember,
}: DashboardClientLayoutProps) {
  return (
    <DashboardProvider
      value={{
        userName,
        isManager,
        allMembers,
        currentMember,
      }}
    >
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          <DashboardMobileNav />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </DashboardProvider>
  );
}