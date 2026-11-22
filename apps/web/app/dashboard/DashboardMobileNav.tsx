"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { getManagerNameForMonth, getCurrentMonth } from "@/lib/manager";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Wallet,
  Calendar,
  Users,
  Menu,
  X,
  BadgeCheck,
  User,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  managerOnly?: boolean;
}

const OVERVIEW_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-5" /> },
];

const DAILY_WORK_ITEMS: NavItem[] = [
  { href: "/dashboard/meal-board", label: "Meal Board", icon: <UtensilsCrossed className="size-5" /> },
  { href: "/dashboard/bazar", label: "Daily Bazar", icon: <ShoppingCart className="size-5" /> },
];

const MONEY_ITEMS: NavItem[] = [
  { href: "/dashboard/advance", label: "Advance", icon: <Wallet className="size-5" />, managerOnly: true },
  { href: "/dashboard/monthly", label: "Monthly Hisab", icon: <Calendar className="size-5" />, managerOnly: true },
];

const PEOPLE_ITEMS: NavItem[] = [
  { href: "/dashboard/members", label: "Members", icon: <Users className="size-5" /> },
];

export function DashboardMobileNav() {
  const { userName, isManager } = useDashboard();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomNavIndex, setBottomNavIndex] = useState(0);

  const month = searchParams.get("month") ?? getCurrentMonth();
  const managerName = getManagerNameForMonth(month);

  const filteredMoney = MONEY_ITEMS.filter((item) => !item.managerOnly || isManager);
  const allNavItems = [
    ...OVERVIEW_ITEMS,
    ...DAILY_WORK_ITEMS,
    ...filteredMoney,
    ...PEOPLE_ITEMS,
  ];

  const currentIndex = allNavItems.findIndex((item) => pathname === item.href);

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-30 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
        <div className="flex-1 flex items-center justify-center px-8">
          <MonthSelector />
        </div>
        <div className="w-12" />
      </header>

      {sidebarOpen && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 right-0 w-80 bg-background border-l border-border flex flex-col">
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
              <span className="font-bold text-lg">Mess Manager</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="size-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-4">
              <MonthSelector />
              <MobileNavSection title="Overview" items={OVERVIEW_ITEMS} pathname={pathname} onClose={() => setSidebarOpen(false)} />
              <MobileNavSection title="Daily Work" items={DAILY_WORK_ITEMS} pathname={pathname} onClose={() => setSidebarOpen(false)} />
              {filteredMoney.length > 0 && (
                <MobileNavSection title="Money" items={filteredMoney} pathname={pathname} onClose={() => setSidebarOpen(false)} />
              )}
              <MobileNavSection title="People" items={PEOPLE_ITEMS} pathname={pathname} onClose={() => setSidebarOpen(false)} />
            </nav>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{userName}</p>
                  <p className="text-sm text-muted-foreground">
                    {isManager ? (
                      <span className="flex items-center gap-1">
                        <BadgeCheck className="size-3" />
                        Manager
                      </span>
                    ) : (
                      "Member"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>,
        document.body
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-30" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-5">
          {allNavItems.slice(0, 5).map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors",
                index === bottomNavIndex || pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <span>{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

interface MobileNavSectionProps {
  title: string;
  items: NavItem[];
  pathname: string;
  onClose: () => void;
}

function MobileNavSection({ title, items, pathname, onClose }: MobileNavSectionProps) {
  return (
    <div>
      <h3 className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted"
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}