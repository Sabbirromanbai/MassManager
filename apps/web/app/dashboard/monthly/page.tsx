import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { Lang, t } from "@/lib/lang";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface MonthlyPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function MonthlyPage({ searchParams }: MonthlyPageProps) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";
  const resolvedSearchParams = await searchParams;
  const month = resolvedSearchParams.month;

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.monthly.title"
        subtitleKey="pages.monthly.subtitle"
        month={month}
        currentLang={lang}
        delay={0}
        icon={<Calendar className="size-5" />}
      />

      <div className="glass-strong rounded-2xl border border-white/15 p-8 text-center animate-fade-in-up delay-1 md:p-12">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/15 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
          <Calendar className="size-8" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">
          {t(lang, "pages.monthly.comingSoon")}
        </h2>
        <p className="mx-auto mb-6 max-w-md text-white/70">
          {t(lang, "pages.monthly.description")}
        </p>
        <Button className="glass rounded-xl px-5 transition-colors hover:bg-white/15">
          {t(lang, "buttons.backToDashboard")}
        </Button>
      </div>
    </div>
  );
}