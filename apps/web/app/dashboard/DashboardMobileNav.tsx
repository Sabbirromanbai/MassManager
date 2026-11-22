"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomNavIndex, setBottomNavIndex] = useState(0);

  const month = searchParams.get("month") ?? getCurrentMonth();
  const managerName = getManagerNameForMonth(month);

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
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  return (
    <>
      {/* Sticky Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 h-16 bg-white/50 dark:bg-black/50 backdrop-blur-sm border-b border-border flex items-center gap-2 px-3">
        {/* Left zone: Hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex-none p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>

        {/* Middle zone: Logo + Title */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <img src="/logo.png" alt="Mess Manager" className="size-8 rounded flex-none" />
          <span className="font-bold text-lg text-foreground truncate">Mess Manager</span>
        </div>

        {/* Right zone: Theme + Language + Sign Out */}
        <div className="flex-none flex items-center gap-1.5">
          <HeaderActions currentLang={lang} variant="header" showSignOut={true} />
        </div>
      </header>

      {/* Left Drawer */}
      {sidebarOpen && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-80 bg-green-950 text-green-50 border-r border-green-800 flex flex-col">
            <div className="flex h-16 items-center justify-between px-4 border-b border-green-800">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Mess Manager" className="size-8 rounded" />
                <span className="font-bold text-lg">Mess Manager</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-green-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="size-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-4">
              <MonthSelector />
              <MobileNavSection title={nav.sectionTitles.overview} items={nav.overview} pathname={pathname} onClose={() => setSidebarOpen(false)} lang={lang} />
              <MobileNavSection title={nav.sectionTitles.dailyWork} items={nav.dailyWork} pathname={pathname} onClose={() => setSidebarOpen(false)} lang={lang} />
              {filteredMoney.length > 0 && (
                <MobileNavSection title={nav.sectionTitles.money} items={filteredMoney} pathname={pathname} onClose={() => setSidebarOpen(false)} lang={lang} />
              )}
              <MobileNavSection title={nav.sectionTitles.people} items={nav.people} pathname={pathname} onClose={() => setSidebarOpen(false)} lang={lang} />
            </nav>
            <div className="px-3 py-2 border-t border-green-800">
              <div className="flex justify-center py-1.5">
                <HeaderActions currentLang={lang} variant="sidebar" showSignOut={true} orientation="horizontal" />
              </div>
              <div className="space-y-2 mb-3">
                <div className="bg-green-900/50 border border-green-800 rounded-lg p-2">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-green-300">{t(lang, "summary.totalBazar")}</span>
                    <span className="font-medium">৳0</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-300">{t(lang, "summary.cashInHand")}</span>
                    <span className="font-medium">৳0</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-green-700 flex items-center justify-center">
                    <User className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{userName}</p>
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
      <nav className="lg:hidden mobile-nav-bar" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="relative flex items-center" style={{ height: "64px" }}>
          {/* Animated Active Pill */}
          <div
            ref={pillRef}
            className="mobile-nav-pill"
            aria-hidden="true"
          />
          {/* Nav Items */}
          <div className="relative flex w-full items-center justify-between px-2">
            {allNavItems.slice(0, 5).map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setSidebarOpen(false);
                  setBottomNavIndex(index);
                }}
              >
                <button
                  ref={(el) => { itemRefs.current[index] = el; }}
                  className={cn(
                    "nav-item-btn flex flex-col items-center justify-center gap-1 py-2 px-3",
                    index === currentIndex ? "text-emerald-500" : "text-white/70"
                  )}
                  aria-current={index === currentIndex ? "page" : undefined}
                  aria-label={t(lang, item.labelKey)}
                >
                  <span className="transition-transform duration-200">{item.icon}</span>
                  <span className="text-xs font-medium transition-colors">{t(lang, item.labelKey)}</span>
                </button>
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
}

function MobileNavSection({ title, items, pathname, onClose, lang }: MobileNavSectionProps) {
  return (
    <div>
      <h3 className="px-3 py-1 text-xs font-semibold text-green-400 uppercase tracking-wider">
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
                  ? "bg-green-800 text-white"
                  : "hover:bg-green-800 text-green-200"
              )}
            >
              <span>{item.icon}</span>
              <span>{t(lang, item.labelKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}