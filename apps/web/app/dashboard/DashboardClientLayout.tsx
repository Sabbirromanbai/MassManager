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
      <div className="flex min-h-dvh">
        <DashboardSidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <DashboardMobileNav />
          <main className="relative z-10 flex-1 px-4 pb-28 pt-4 sm:px-6 md:pt-6 lg:px-8 lg:pb-8 lg:pt-8">
            <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
              <div
                className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-emerald-50/95 dark:from-black/85 dark:via-black/80 dark:to-emerald-950/75" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.10),transparent_60%)]" />
            </div>
            <div className="relative z-10 mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
