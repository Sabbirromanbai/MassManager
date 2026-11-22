import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Wallet } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { Lang, t } from "@/lib/lang";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface AdvancePageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function AdvancePage({ searchParams }: AdvancePageProps) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";
  const resolvedSearchParams = await searchParams;
  const month = resolvedSearchParams.month;

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.advance.title"
        subtitleKey="pages.advance.subtitle"
        month={month}
        currentLang={lang}
        delay={0}
        icon={<Wallet className="size-5" />}
      />

      <div className="glass-strong rounded-2xl border border-white/15 p-8 text-center animate-fade-in-up delay-1 md:p-12">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/15 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
          <Wallet className="size-8" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">
          {t(lang, "pages.advance.comingSoon")}
        </h2>
        <p className="mx-auto mb-6 max-w-md text-white/70">
          {t(lang, "pages.advance.description")}
        </p>
        <Button className="glass rounded-xl px-5 transition-colors hover:bg-white/15">
          {t(lang, "buttons.backToDashboard")}
        </Button>
      </div>
    </div>
  );
}