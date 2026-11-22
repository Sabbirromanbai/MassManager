import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isManagerName } from "@/lib/manager";
import { SignOutButton } from "./SignOutButton";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const userName = session.user.name;
  const isManager = isManagerName(userName);

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
              <div className="text-2xl font-bold">{userName}</div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}