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
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6",
        "animate-fade-in-up",
        delayClass
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-white">{t(currentLang, titleKey)}</h1>
          {subtitleKey && (
            <p className="text-white/75 mt-1 text-sm">
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