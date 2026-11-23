import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { Lang, t } from "@/lib/lang";
import { COLLECTIONS, OfficeLoan } from "@/lib/models";
import {
  type OfficeLoanSummary,
  type SerializedOfficeLoan,
  getMemberObjectId,
  getOfficeLoanSummary,
  serializeOfficeLoan,
} from "@/lib/officeLoans";
import { OfficeLoansClient } from "./OfficeLoansClient";

export default async function OfficeLoansPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const member = await getOrLinkMember({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email ?? "",
  });

  // The API enforces this too; redirecting here keeps the page fully private.
  if (!member || !isCurrentManagerMember(member)) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";

  let loans: SerializedOfficeLoan[] = [];
  let summary: OfficeLoanSummary = {
    loanCount: 0,
    totalLoaned: 0,
    totalRepaid: 0,
    remainingBalance: 0,
  };
  let initialError = "";

  try {
    const db = await getDb();
    const docs = await db
      .collection<OfficeLoan>(COLLECTIONS.officeLoans)
      .find({ memberId: getMemberObjectId(member) })
      .sort({ createdAt: -1 })
      .toArray();

    loans = docs.map((doc) => serializeOfficeLoan(doc));
    summary = getOfficeLoanSummary(docs);
  } catch {
    initialError = t(lang, "pages.officeLoans.errorLoad");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.officeLoans.title"
        subtitleKey="pages.officeLoans.subtitle"
        currentLang={lang}
        delay={0}
        icon={<Landmark className="size-5" />}
      />
      <OfficeLoansClient
        lang={lang}
        initialLoans={loans}
        initialSummary={summary}
        initialError={initialError}
        defaultDate={new Date().toISOString().slice(0, 10)}
      />
    </div>
  );
}
