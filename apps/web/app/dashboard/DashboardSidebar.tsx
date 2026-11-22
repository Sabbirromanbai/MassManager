"use client";

import { useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { HeaderActions } from "@/components/header-actions";
import { getManagerNameForMonth, getCurrentMonth } from "@/lib/manager";
import { t } from "@/lib/lang";
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
  labelKey: string;
  icon: React.ReactNode;
  managerOnly?: boolean;
}

function getNavItems(lang: "bn" | "en") {
  return {
    overview: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard className="size-5" /> },
    ],
    dailyWork: [
      { href: "/dashboard/meal-board", labelKey: "nav.mealBoard", icon: <UtensilsCrossed className="size-5" /> },
      { href: "/dashboard/bazar", labelKey: "nav.dailyBazar", icon: <ShoppingCart className="size-5" /> },
    ],
    money: [
      { href: "/dashboard/advance", labelKey: "nav.advance", icon: <Wallet className="size-5" />, managerOnly: true },
      { href: "/dashboard/monthly", labelKey: "nav.monthlyHisab", icon: <Calendar className="size-5" />, managerOnly: true },
    ],
    people: [
      { href: "/dashboard/members", labelKey: "nav.members", icon: <Users className="size-5" /> },
    ],
    sectionTitles: {
      overview: t(lang, "nav.overview"),
      dailyWork: t(lang, "nav.dailyWork"),
      money: t(lang, "nav.money"),
      people: t(lang, "nav.people"),
    },
  };
}

export function DashboardSidebar() {
  const { userName, isManager, allMembers, currentMember, lang } = useDashboard();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const month = searchParams.get("month") ?? getCurrentMonth();
  const managerName = getManagerNameForMonth(month);

  const nav = getNavItems(lang);
  const filteredMoney = nav.money.filter((item) => !item.managerOnly || isManager);

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:static flex-col bg-green-950 text-green-50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-green-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Mess Manager" className="size-8 rounded" />
            <span className="font-bold text-lg truncate">Mess Manager</span>
          </div>
        )}
        {collapsed && (
          <img src="/logo.png" alt="Mess Manager" className="size-8 rounded mx-auto" />
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
          title={nav.sectionTitles.overview}
          items={nav.overview}
          pathname={pathname}
          collapsed={collapsed}
          lang={lang}
        />

        <SidebarSection
          title={nav.sectionTitles.dailyWork}
          items={nav.dailyWork}
          pathname={pathname}
          collapsed={collapsed}
          lang={lang}
        />

        {filteredMoney.length > 0 && (
          <SidebarSection
            title={nav.sectionTitles.money}
            items={filteredMoney}
            pathname={pathname}
            collapsed={collapsed}
            lang={lang}
          />
        )}

        <SidebarSection
          title={nav.sectionTitles.people}
          items={nav.people}
          pathname={pathname}
          collapsed={collapsed}
          lang={lang}
        />
      </nav>

      <div className="p-3 border-t border-green-800">
        <div className="flex justify-center pt-2 pb-3">
          <HeaderActions currentLang={lang} variant="sidebar" showSignOut={true} />
        </div>

        {!collapsed && (
          <div className="space-y-3 mb-4">
            <div className="bg-green-900/50 border border-green-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-green-300">{t(lang, "summary.totalBazar")}</span>
                <span className="font-medium">৳0</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-300">{t(lang, "summary.cashInHand")}</span>
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
                      {t(lang, "badges.manager")}
                    </span>
                  ) : (
                    t(lang, "badges.member")
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
  lang: "bn" | "en";
}

function SidebarSection({ title, items, pathname, collapsed, lang }: SidebarSectionProps) {
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
              title={collapsed ? t(lang, item.labelKey) : undefined}
            >
              <span>{item.icon}</span>
              {!collapsed && <span>{t(lang, item.labelKey)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}