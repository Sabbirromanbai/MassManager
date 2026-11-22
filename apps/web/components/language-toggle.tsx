"use client";

import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
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
      className={className}
      onClick={handleToggle}
      aria-label="Toggle language"
    >
      <Globe className="size-5" />
      <span className="hidden sm:inline-block ml-1 font-medium uppercase">
        {currentLang === "bn" ? "BN" : "EN"}
      </span>
    </Button>
  );
}