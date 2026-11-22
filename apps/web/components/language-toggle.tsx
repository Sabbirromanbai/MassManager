"use client";

import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { cn } from "cn";
import { Globe } from "lucide-react";
import { Lang } from "@/lib/lang";

interface LanguageToggleProps {
  currentLang: Lang;
  className?: string;
}

export function LanguageToggle({ currentLang, className }: LanguageToggleProps) {
  const router = useRouter();

  async function handleToggle() {
    const newLang: Lang = currentLang === "bn" ? "en" : "bn";
    await fetch("/api/lang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: newLang }),
    });
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full border border-white/20 bg-white/10 px-3 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/30",
        className
      )}
      onClick={handleToggle}
      aria-label="Toggle language"
    >
      <Globe className="size-4" />
      <span className="ml-1.5 text-xs font-semibold uppercase tracking-wide">
        {currentLang === "bn" ? "BN" : "EN"}
      </span>
    </Button>
  );
}