"use client";

import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardMobileNav } from "./DashboardMobileNav";
import { Member } from "@/lib/models";
import { Lang } from "@/lib/lang";

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  userName: string;
  isManager: boolean;
  allMembers: Member[];
  currentMember: Member | null;
  lang: Lang;
}

export function DashboardClientLayout({
  children,
  userName,
  isManager,
  allMembers,
  currentMember,
  lang,
}: DashboardClientLayoutProps) {
  return (
    <DashboardProvider
      value={{
        userName,
        isManager,
        allMembers,
        currentMember,
        lang,
      }}
    >
      <div className="min-h-screen flex">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative lg:ml-0">
          <DashboardMobileNav />
          <main className="flex-1 pt-16 lg:pt-0 p-4 md:p-6 lg:p-8 relative z-10">
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: 'url("/background.jpg")',
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="absolute inset-0 bg-black/75" />
            </div>
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}