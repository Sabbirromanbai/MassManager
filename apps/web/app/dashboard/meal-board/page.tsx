import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { Lang, t } from "@/lib/lang";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface MealBoardPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function MealBoardPage({ searchParams }: MealBoardPageProps) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";
  const resolvedSearchParams = await searchParams;
  const month = resolvedSearchParams.month;

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.mealBoard.title"
        subtitleKey="pages.mealBoard.subtitle"
        month={month}
        currentLang={lang}
        delay={0}
      />

      <div className="glass p-8 text-center animate-fade-in-up delay-1">
        <UtensilsCrossed className="size-16 mx-auto text-white/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-white">{t(lang, "pages.mealBoard.comingSoon")}</h2>
        <p className="text-white/70 mb-6">
          {t(lang, "pages.mealBoard.description")}
        </p>
        <Button className="glass">{t(lang, "buttons.backToDashboard")}</Button>
      </div>
    </div>
  );
}