import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { getAllMembers } from "@/lib/stats";
import { toPublicMember } from "@/lib/memberView";
import { DashboardClientLayout } from "./DashboardClientLayout";
import { Lang } from "@/lib/lang";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as Lang) ?? "bn";

  const user = session.user;
  const member = await getOrLinkMember({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
  });

  const allMembers = await getAllMembers();

  const serializedMember = member ? toPublicMember(member) : null;
  const serializedAllMembers = allMembers.map(toPublicMember);

  const isManager = member ? isCurrentManagerMember(member) : false;

  return (
    <DashboardClientLayout
      userName={user.name}
      isManager={isManager}
      allMembers={serializedAllMembers}
      currentMember={serializedMember}
      lang={lang}
    >
      {children}
    </DashboardClientLayout>
  );
}