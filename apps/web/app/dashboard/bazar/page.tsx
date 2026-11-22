import { cookies, headers } from "next/headers";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { getCurrentMonth } from "@/lib/manager";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BazarClient } from "./BazarClient";
import { Lang, t } from "@/lib/lang";
import { BazarEntry } from "@/lib/models";
import { ShoppingCart } from "lucide-react";

interface BazarPageProps {
  searchParams: Promise<{ month?: string }>;
}

async function getSessionMember() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { user: null, member: null, lang: "bn" as Lang };

  const user = session.user;
  const member = await getOrLinkMember({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
  });

  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";

  return { user, member, lang };
}

export default async function BazarPage({ searchParams }: BazarPageProps) {
  const { user, member, lang } = await getSessionMember();

  if (!user || !member) {
    return (
      <div className="space-y-6">
        <PageHeader
          titleKey="pages.bazar.title"
          subtitleKey="pages.bazar.subtitle"
          currentLang={lang}
          delay={0}
          icon={<ShoppingCart className="size-5" />}
        />
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const month = resolvedSearchParams.month ?? getCurrentMonth();
  const isManager = isCurrentManagerMember(member);

  const db = await getDb();
  const entries = await db
    .collection<BazarEntry>("bazarEntries")
    .find({ month })
    .sort({ date: 1, createdAt: 1 })
    .toArray();

  const serialized = entries.map((entry) => ({
    id: entry._id!.toString(),
    month: entry.month,
    date: entry.date,
    day: entry.day,
    description: entry.description,
    amount: entry.amount,
    createdBy: entry.createdBy.toString(),
    createdAt: entry.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.bazar.title"
        subtitleKey="pages.bazar.subtitle"
        month={month}
        currentLang={lang}
        delay={0}
        icon={<ShoppingCart className="size-5" />}
      />
      <BazarClient
        lang={lang}
        month={month}
        isManager={isManager}
        entries={serialized}
      />
    </div>
  );
}