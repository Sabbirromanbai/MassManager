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
  const nextLang: Lang = currentLang === "bn" ? "en" : "bn";

  async function handleToggle() {
    await fetch("/api/lang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: nextLang }),
    });
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-9 gap-1.5 rounded-full px-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70",
        className
      )}
      onClick={handleToggle}
      aria-label={
        nextLang === "en" ? "Switch language to English" : "ভাষা বাংলায় পরিবর্তন করুন"
      }
      title={nextLang === "en" ? "English" : "বাংলা"}
    >
      <Globe className="size-4" />
      <span className="text-xs font-semibold uppercase tracking-wide">
        {currentLang === "bn" ? "BN" : "EN"}
      </span>
    </Button>
  );
}
