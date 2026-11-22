"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { HeaderActions } from "@/components/header-actions";
import { t } from "@/lib/lang";
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

export function DashboardMobileNav() {
  const { userName, isManager, lang } = useDashboard();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = getNavItems(lang);
  const filteredMoney = nav.money.filter((item) => !item.managerOnly || isManager);
  const allNavItems = [
    ...nav.overview,
    ...nav.dailyWork,
    ...filteredMoney,
    ...nav.people,
  ];

  const currentIndex = allNavItems.findIndex((item) => pathname === item.href);

  // Pill animation refs
  const pillRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Update pill position when active index changes
  useEffect(() => {
    if (pillRef.current && itemRefs.current[currentIndex]) {
      const item = itemRefs.current[currentIndex];
      if (item) {
        const parentRect = item.parentElement?.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        if (parentRect && itemRect) {
          const pill = pillRef.current;
          pill.style.setProperty("--pill-x", `${itemRect.left - parentRect.left}px`);
          pill.style.setProperty("--pill-w", `${itemRect.width}px`);
        }
      }
    }
  }, [currentIndex, pathname]);

  // Initialize pill position on mount
  useEffect(() => {
    if (pillRef.current && itemRefs.current[currentIndex]) {
      const item = itemRefs.current[currentIndex];
      if (item) {
        const parentRect = item.parentElement?.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        if (parentRect && itemRect) {
          const pill = pillRef.current;
          pill.style.setProperty("--pill-x", `${itemRect.left - parentRect.left}px`);
          pill.style.setProperty("--pill-w", `${itemRect.width}px`);
        }
      }
    }
  }, []);

  // Close the drawer on navigation.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock background scroll and support Escape while the drawer is open.
  useEffect(() => {
    if (!sidebarOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const linkBase =
    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200";

  return (
    <>
      {/* Sticky Mobile Top Bar */}
      <header className="dark sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-emerald-500/20 bg-green-950/90 px-3 backdrop-blur-md lg:hidden">
        {/* Left zone: Hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex-none rounded-lg p-2 text-green-100 transition-colors hover:app-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          aria-label="Open menu"
          aria-expanded={sidebarOpen}
          aria-controls="dashboard-mobile-drawer"
        >
          <Menu className="size-6" />
        </button>

        {/* Middle zone: Logo + Title */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <img src="/logo.png" alt="Mess Manager" className="size-6 rounded-md" />
          </div>
          <span className="truncate bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-base font-bold text-transparent sm:text-lg">
            Mess Manager
          </span>
        </div>

        {/* Right zone: Theme + Language + Sign Out */}
        <div className="flex flex-none items-center gap-1.5">
          <HeaderActions currentLang={lang} variant="header" showSignOut={true} />
        </div>
      </header>

      {/* Left Drawer */}
      {sidebarOpen && createPortal(
        <div className="dark fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="dashboard-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-emerald-500/20 bg-gradient-to-b from-green-950/98 to-emerald-950/98 shadow-[4px_0_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-emerald-500/20 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_16px_rgba(16,185,129,0.35)]">
                  <img src="/logo.png" alt="Mess Manager" className="size-7 rounded-lg" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                  Mess Manager
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-green-100 transition-colors hover:app-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                aria-label="Close menu"
              >
                <X className="size-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto p-3">
              <div className="mb-2 rounded-xl border app-border app-surface p-2 backdrop-blur-sm">
                <MonthSelector />
              </div>
              <MobileNavSection title={nav.sectionTitles.overview} items={nav.overview} pathname={pathname} onClose={() => setSidebarOpen(false)} lang={lang} linkBase={linkBase} />
              <MobileNavSection title={nav.sectionTitles.dailyWork} items={nav.dailyWork} pathname={pathname} onClose={() => setSidebarOpen(false)} lang={lang} linkBase={linkBase} />
              {filteredMoney.length > 0 && (
                <MobileNavSection title={nav.sectionTitles.money} items={filteredMoney} pathname={pathname} onClose={() => setSidebarOpen(false)} lang={lang} linkBase={linkBase} />
              )}
              <MobileNavSection title={nav.sectionTitles.people} items={nav.people} pathname={pathname} onClose={() => setSidebarOpen(false)} lang={lang} linkBase={linkBase} />
            </nav>
            <div className="border-t border-emerald-500/20 px-3 py-3">
              <div className="flex justify-center py-1.5">
                <HeaderActions currentLang={lang} variant="sidebar" showSignOut={true} orientation="horizontal" />
              </div>
              <div className="mb-3 space-y-2">
                <div className="rounded-lg border app-border app-surface p-2 backdrop-blur-sm">
                  <div className="mb-0.5 flex items-center justify-between text-xs">
                    <span className="text-green-300">{t(lang, "summary.totalBazar")}</span>
                    <span className="font-medium app-text">৳0</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-300">{t(lang, "summary.cashInHand")}</span>
                    <span className="font-medium app-text">৳0</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border app-border app-surface p-2 backdrop-blur-sm transition-colors hover:app-surface-strong">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    <User className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium app-text">{userName}</p>
                    <p className="text-xs text-green-400">
                      {isManager ? (
                        <span className="flex items-center gap-1">
                          <BadgeCheck className="size-2.5" />
                          {t(lang, "badges.manager")}
                        </span>
                      ) : (
                        t(lang, "badges.member")
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>,
        document.body
      )}

      {/* Bottom Navigation Bar - Glassmorphism with Animated Pill */}
      <nav className="mobile-nav-bar overflow-hidden" aria-label="Primary">
        <div className="relative flex w-full items-center" style={{ height: "60px" }}>
          {/* Animated Active Pill */}
          <div ref={pillRef} className="mobile-nav-pill" aria-hidden="true" />
          {/* Nav Items */}
          <div className="relative flex w-full items-stretch px-1.5">
            {allNavItems.slice(0, 5).map((item, index) => (
              <Link
                key={item.href}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                href={item.href}
                className={cn(
                  "nav-item-btn group min-w-0 flex-1",
                  index === currentIndex
                    ? "app-text-emerald"
                    : "text-green-200/75 hover:app-text"
                )}
                aria-current={index === currentIndex ? "page" : undefined}
                aria-label={t(lang, item.labelKey)}
              >
                <span className="transition-transform duration-200 group-hover:scale-110">
                  {item.icon}
                </span>
                <span className="w-full truncate text-center text-[10px] font-medium leading-tight">
                  {t(lang, item.labelKey)}
                </span>
              </Link>
            ))}
          </div>
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
  lang: "bn" | "en";
  linkBase: string;
}

function MobileNavSection({ title, items, pathname, onClose, lang, linkBase }: MobileNavSectionProps) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] app-text-emerald opacity-70">
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  linkBase,
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70",
                  active
                    ? "bg-emerald-500/15 app-text shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]"
                    : "text-green-200 hover:app-surface-strong hover:app-text"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                )}
                <span className={cn("transition-transform duration-200", active ? "app-text-emerald" : "text-green-300")}>
                  {item.icon}
                </span>
                <span className="truncate">{t(lang, item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}