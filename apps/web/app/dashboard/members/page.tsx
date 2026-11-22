import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Users } from "lucide-react";

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="size-6" />
            Members
          </h1>
          <p className="text-muted-foreground">Manage mess members</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Users className="size-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground mb-6">
          Member management functionality will be implemented here.
        </p>
        <Button>Back to Dashboard</Button>
      </div>
    </div>
  );
}