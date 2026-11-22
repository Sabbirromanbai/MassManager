import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { Lang, t } from "@/lib/lang";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface BazarPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function BazarPage({ searchParams }: BazarPageProps) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";
  const resolvedSearchParams = await searchParams;
  const month = resolvedSearchParams.month;

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.bazar.title"
        subtitleKey="pages.bazar.subtitle"
        month={month}
        currentLang={lang}
        delay={0}
      />

      <div className="glass p-8 text-center animate-fade-in-up delay-1">
        <ShoppingCart className="size-16 mx-auto text-white/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-white">{t(lang, "pages.bazar.comingSoon")}</h2>
        <p className="text-white/70 mb-6">
          {t(lang, "pages.bazar.description")}
        </p>
        <Button className="glass">{t(lang, "buttons.backToDashboard")}</Button>
      </div>
    </div>
  );
}