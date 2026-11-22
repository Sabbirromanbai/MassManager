"use client";

import { HeaderActions } from "@/components/header-actions";
import { t } from "@/lib/lang";
import { Lang } from "@/lib/lang";
import { cn } from "cn";

interface PageHeaderProps {
  titleKey: string;
  subtitleKey?: string;
  month?: string;
  managerName?: string;
  currentLang: Lang;
  delay?: number;
  icon?: React.ReactNode;
}

export function PageHeader({
  titleKey,
  subtitleKey,
  month,
  managerName,
  currentLang,
  delay = 0,
  icon,
}: PageHeaderProps) {
  const delayClass = `delay-${Math.min(delay, 5)}`;

  return (
    <header
      className={cn(
        "glass-subtle flex flex-col gap-4 rounded-2xl border border-white/15 px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between mb-6",
        "animate-fade-in-up",
        delayClass
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        {icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/15 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.2)]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-white">
            {t(currentLang, titleKey)}
          </h1>
          {subtitleKey && (
            <p className="mt-1 text-sm text-white/70">
              {t(currentLang, subtitleKey)
                .replace("{month}", month ?? "")
                .replace("{managerName}", managerName ?? "")}
            </p>
          )}
        </div>
      </div>
      <div className="hidden lg:flex">
        <HeaderActions currentLang={currentLang} variant="header" />
      </div>
    </header>
  );
}