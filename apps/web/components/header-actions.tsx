"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@workspace/ui/components/button";
import { Sun, Moon, Globe, LogOut } from "lucide-react";
import { Lang } from "@/lib/lang";
import { t } from "@/lib/lang";
import { signOut } from "@/lib/auth-client";

type Variant = "header" | "sidebar";
type Orientation = "horizontal" | "vertical";

interface HeaderActionsProps {
  currentLang: Lang;
  variant?: Variant;
  showSignOut?: boolean;
  orientation?: Orientation;
}

const baseButtonClass = "rounded-full transition-all";
const headerButtonClass = "h-10 w-10 bg-white/15 dark:bg-black/15 backdrop-blur-sm border border-white/25 dark:border-black/25 text-foreground hover:bg-white/25 dark:hover:bg-black/25 hover:border-white/35 dark:hover:border-black/35";
const sidebarButtonClass = "h-9 w-9 bg-white/10 dark:bg-black/10 text-foreground hover:bg-white/20 dark:hover:bg-black/20";
const headerLangClass = "rounded-full bg-white/15 dark:bg-black/15 backdrop-blur-sm border border-white/25 dark:border-black/25 text-foreground hover:bg-white/25 dark:hover:bg-black/25 hover:border-white/35 dark:hover:border-black/35";
const sidebarLangClass = "rounded-full bg-white/10 dark:bg-black/10 text-foreground hover:bg-white/20 dark:hover:bg-black/20";
const signOutButtonClass = "rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30";

export function HeaderActions({ currentLang, variant = "header", showSignOut = true, orientation = "vertical" }: HeaderActionsProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const isDark = mounted && resolvedTheme === "dark";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const buttonClass = `${baseButtonClass} ${variant === "sidebar" ? sidebarButtonClass : headerButtonClass}`;
  const langClass = variant === "sidebar" ? sidebarLangClass : headerLangClass;
  const isHorizontal = orientation === "horizontal" || (variant === "header");

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  if (!mounted) {
    return (
      <div className={isHorizontal ? "flex items-center gap-2" : "flex flex-col items-center gap-1.5"}>
        <Button
          variant="ghost"
          size="icon"
          className={buttonClass}
          aria-label="Switch theme"
          disabled
        >
          <Moon className="size-5" />
        </Button>
        <LanguageToggle currentLang={currentLang} className={langClass} />
      </div>
    );
  }

  return (
    <div className={isHorizontal ? "flex items-center gap-2" : "flex flex-col items-center gap-1.5"}>
      <Button
        variant="ghost"
        size="icon"
        className={buttonClass}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>
      <LanguageToggle currentLang={currentLang} className={langClass} />
      {showSignOut && (
        <Button
          variant="ghost"
          className={cn(
            "rounded-full gap-2 text-white font-medium",
            signOutButtonClass,
            isHorizontal ? "flex-row items-center px-3 py-2" : "flex-col items-center gap-1 px-3 py-2"
          )}
          onClick={handleSignOut}
          aria-label={t(currentLang, "buttons.signOut")}
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">
            {t(currentLang, "buttons.signOut")}
          </span>
        </Button>
      )}
    </div>
  );
}

import { cn } from "cn";