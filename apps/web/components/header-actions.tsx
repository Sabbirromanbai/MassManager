"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@workspace/ui/components/button";
import { Sun, Moon, LogOut } from "lucide-react";
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

const baseButtonClass = "rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70";
const headerButtonClass =
  "h-9 w-9 app-surface-strong app-border app-text hover:app-surface-hover";
const sidebarButtonClass =
  "h-9 w-9 border border-white/15 bg-white/10 text-white hover:bg-white/20";
const headerLangClass = "app-surface-strong app-border app-text hover:app-surface-hover";
const sidebarLangClass = "border border-white/15 bg-white/10 text-white hover:bg-white/20";
const signOutButtonClass =
  "rounded-full border border-red-500/30 bg-red-500/15 app-text-danger hover:bg-red-500/25";

export function HeaderActions({
  currentLang,
  variant = "header",
  showSignOut = true,
  orientation = "vertical",
}: HeaderActionsProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const isDark = mounted && resolvedTheme === "dark";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const buttonClass = `${baseButtonClass} ${variant === "sidebar" ? sidebarButtonClass : headerButtonClass}`;
  const langClass = variant === "sidebar" ? sidebarLangClass : headerLangClass;
  const isHorizontal = orientation === "horizontal" || variant === "header";

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
        aria-pressed={isDark}
      >
        {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>
      <LanguageToggle currentLang={currentLang} className={langClass} />
      {showSignOut && (
        <Button
          variant="ghost"
          className={cn(
            "gap-2 font-medium",
            signOutButtonClass,
            isHorizontal
              ? "h-9 flex-row items-center px-3"
              : "h-9 w-auto flex-row items-center px-2.5 text-xs"
          )}
          onClick={handleSignOut}
          aria-label={t(currentLang, "buttons.signOut")}
        >
          <LogOut className="size-4" />
          <span className={isHorizontal ? "hidden sm:inline" : "inline"}>
            {t(currentLang, "buttons.signOut")}
          </span>
        </Button>
      )}
    </div>
  );
}
