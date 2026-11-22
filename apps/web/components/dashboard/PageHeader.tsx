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
        "glass-subtle flex flex-col gap-4 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        "animate-fade-in-up",
        delayClass
      )}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl app-icon-emerald sm:size-11">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold tracking-tight app-text sm:text-2xl">
            {t(currentLang, titleKey)}
          </h1>
          {subtitleKey && (
            <p className="mt-1 break-words text-sm app-text-muted">
              {t(currentLang, subtitleKey)
                .replace("{month}", month ?? "")
                .replace("{managerName}", managerName ?? "")}
            </p>
          )}
        </div>
      </div>
      <div className="hidden shrink-0 lg:flex">
        <HeaderActions currentLang={currentLang} variant="header" />
      </div>
    </header>
  );
}