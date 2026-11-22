import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Users } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { Lang, t } from "@/lib/lang";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface MembersPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";
  const resolvedSearchParams = await searchParams;
  const month = resolvedSearchParams.month;

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.members.title"
        subtitleKey="pages.members.subtitle"
        month={month}
        currentLang={lang}
        delay={0}
      />

      <div className="glass p-8 text-center animate-fade-in-up delay-1">
        <Users className="size-16 mx-auto text-white/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-white">{t(lang, "pages.members.comingSoon")}</h2>
        <p className="text-white/70 mb-6">
          {t(lang, "pages.members.description")}
        </p>
        <Button className="glass">{t(lang, "buttons.backToDashboard")}</Button>
      </div>
    </div>
  );
}