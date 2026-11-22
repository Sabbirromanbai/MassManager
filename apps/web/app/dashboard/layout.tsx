import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { getAllMembers } from "@/lib/stats";
import { DashboardClientLayout } from "./DashboardClientLayout";

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

  const user = session.user;
  const member = await getOrLinkMember({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
  });

  const allMembers = await getAllMembers();

  const serializedMember = member
    ? {
        ...member,
        _id: member._id?.toString(),
      }
    : null;

  const serializedAllMembers = allMembers.map((m) => ({
    ...m,
    _id: m._id?.toString(),
  }));

  const isManager = member ? isCurrentManagerMember(member) : false;

  return (
    <DashboardClientLayout
      userName={user.name}
      isManager={isManager}
      allMembers={serializedAllMembers}
      currentMember={serializedMember}
    >
      {children}
    </DashboardClientLayout>
  );
}