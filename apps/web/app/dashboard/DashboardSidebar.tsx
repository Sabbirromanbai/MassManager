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
  Landmark,
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
      { href: "/dashboard/office-loans", labelKey: "nav.officeLoan", icon: <Landmark className="size-5" />, managerOnly: true },
      { href: "/dashboard/monthly", labelKey: "nav.monthlyHisab", icon: <Calendar className="size-5" />, managerOnly: true },
      { href: "/dashboard/member-report", labelKey: "nav.memberReport", icon: <User className="size-5" /> },
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

  const linkBase =
    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200";

  return (
    <aside
      className={cn(
        "dark hidden shrink-0 flex-col border-r border-emerald-500/15 bg-gradient-to-b from-green-950 via-green-950 to-emerald-950/90 text-green-50 shadow-[4px_0_24px_rgba(0,0,0,0.25)] backdrop-blur-md transition-[width] duration-300 lg:sticky lg:top-0 lg:flex lg:h-dvh",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-emerald-500/15 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_16px_rgba(16,185,129,0.35)]">
              <img src="/logo.png" alt="Mess Manager" className="size-7 rounded-lg" />
            </div>
            <span className="truncate bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-lg font-bold text-transparent">
              Mess Manager
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_16px_rgba(16,185,129,0.35)]">
            <img src="/logo.png" alt="Mess Manager" className="size-7 rounded-lg" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-green-200 transition-colors hover:app-surface-strong hover:app-text"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {!collapsed && (
          <div className="mb-2 rounded-xl border app-border app-surface p-2 backdrop-blur-sm">
            <MonthSelector />
          </div>
        )}

        <SidebarSection
          title={nav.sectionTitles.overview}
          items={nav.overview}
          pathname={pathname}
          collapsed={collapsed}
          lang={lang}
          linkBase={linkBase}
        />

        <SidebarSection
          title={nav.sectionTitles.dailyWork}
          items={nav.dailyWork}
          pathname={pathname}
          collapsed={collapsed}
          lang={lang}
          linkBase={linkBase}
        />

        {filteredMoney.length > 0 && (
          <SidebarSection
            title={nav.sectionTitles.money}
            items={filteredMoney}
            pathname={pathname}
            collapsed={collapsed}
            lang={lang}
            linkBase={linkBase}
          />
        )}

        <SidebarSection
          title={nav.sectionTitles.people}
          items={nav.people}
          pathname={pathname}
          collapsed={collapsed}
          lang={lang}
          linkBase={linkBase}
        />
      </nav>

      <div className="border-t border-emerald-500/15 p-3">
        <div className="flex justify-center pt-1 pb-3">
          <HeaderActions currentLang={lang} variant="sidebar" showSignOut={true} />
        </div>

        {!collapsed && (
          <div className="space-y-3">
            <div className="rounded-xl border app-border app-surface p-3 backdrop-blur-sm">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-green-300">{t(lang, "summary.totalBazar")}</span>
                <span className="font-medium app-text">৳0</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-300">{t(lang, "summary.cashInHand")}</span>
                <span className="font-medium app-text">৳0</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border app-border app-surface p-2.5 backdrop-blur-sm transition-colors hover:app-surface-strong">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <User className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium app-text">{userName}</p>
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
            <button
              className="rounded-lg p-1.5 text-green-200 transition-colors hover:app-surface-strong hover:app-text"
              title="Mess Manager"
            >
              <Building2 className="size-5" />
            </button>
            <button
              className="rounded-lg p-1.5 text-green-200 transition-colors hover:app-surface-strong hover:app-text"
              title={userName}
            >
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
  linkBase: string;
}

function SidebarSection({ title, items, pathname, collapsed, lang, linkBase }: SidebarSectionProps) {
  if (items.length === 0) return null;

  return (
    <div>
      {!collapsed && (
        <h3 className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] app-text-emerald opacity-70">
          {title}
        </h3>
      )}
      <ul className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  linkBase,
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70",
                  active
                    ? "bg-emerald-500/15 app-text shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]"
                    : "text-green-200 hover:app-surface-strong hover:app-text",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? t(lang, item.labelKey) : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                )}
                <span className={cn("transition-transform duration-200", active ? "app-text-emerald" : "text-green-300 group-hover:app-text-emerald")}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{t(lang, item.labelKey)}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
