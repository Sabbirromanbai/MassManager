import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getManagerNameForMonth, getCurrentMonth } from "@/lib/manager";
import { getOrLinkMember, isCurrentManagerMember } from "@/lib/currentMember";
import { SignOutButton } from "./SignOutButton";

export default async function DashboardPage() {
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

  const currentMonth = getCurrentMonth();
  const managerName = getManagerNameForMonth(currentMonth);
  const isManager = member ? isCurrentManagerMember(member) : false;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <SignOutButton />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{user.name}</div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isManager
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {isManager ? "Manager" : "Member"}
              </span>
            </div>

            <div className="text-muted-foreground">
              <p>Welcome to the Mess Manager dashboard.</p>
              <p className="mt-1">
                Current role: <strong>{isManager ? "Manager" : "Member"}</strong>
              </p>
              <p className="mt-2">
                This month&apos;s manager: <strong>{managerName}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}