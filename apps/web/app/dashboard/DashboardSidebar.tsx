"use client";

import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  User,
  BadgeCheck,
  Building2,
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

export function DashboardSidebar() {
  const { userName, isManager, allMembers, currentMember } = useDashboard();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const month = searchParams.get("month") ?? getCurrentMonth();
  const managerName = getManagerNameForMonth(month);

  const filteredDailyWork = DAILY_WORK_ITEMS;
  const filteredMoney = MONEY_ITEMS.filter((item) => !item.managerOnly || isManager);
  const filteredPeople = PEOPLE_ITEMS;

  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-green-950 text-green-50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-green-800">
        {!collapsed && (
          <span className="font-bold text-lg truncate">Mess Manager</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-green-800 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {!collapsed && (
          <div className="mb-4">
            <MonthSelector />
          </div>
        )}

        <SidebarSection
          title="Overview"
          items={OVERVIEW_ITEMS}
          pathname={pathname}
          collapsed={collapsed}
        />

        <SidebarSection
          title="Daily Work"
          items={filteredDailyWork}
          pathname={pathname}
          collapsed={collapsed}
        />

        {filteredMoney.length > 0 && (
          <SidebarSection
            title="Money"
            items={filteredMoney}
            pathname={pathname}
            collapsed={collapsed}
          />
        )}

        <SidebarSection
          title="People"
          items={filteredPeople}
          pathname={pathname}
          collapsed={collapsed}
        />
      </nav>

      <div className="p-3 border-t border-green-800">
        {!collapsed && (
          <div className="space-y-3 mb-4">
            <div className="bg-green-900/50 border border-green-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-green-300">Total Bazar</span>
                <span className="font-medium">৳0</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-300">Cash in Hand</span>
                <span className="font-medium">৳0</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-green-700 flex items-center justify-center">
                <User className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-green-400">
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
        )}

        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <button className="p-1 rounded hover:bg-green-800 transition-colors" title="Mess Manager">
              <Building2 className="size-5" />
            </button>
            <button className="p-1 rounded hover:bg-green-800 transition-colors" title={userName}>
              <User className="size-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

interface SidebarSectionProps {
  title: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
}

function SidebarSection({ title, items, pathname, collapsed }: SidebarSectionProps) {
  if (items.length === 0) return null;

  return (
    <div>
      {!collapsed && (
        <h3 className="px-3 py-1 text-xs font-semibold text-green-400 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                "hover:bg-green-800",
                pathname === item.href
                  ? "bg-green-800 text-white"
                  : "text-green-200",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <span>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}