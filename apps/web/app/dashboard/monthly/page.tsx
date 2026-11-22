import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Calendar } from "lucide-react";

export default function MonthlyPage() {
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
            <Calendar className="size-6" />
            Monthly Hisab
          </h1>
          <p className="text-muted-foreground">Monthly settlement and reports</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Calendar className="size-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground mb-6">
          Monthly hisab functionality will be implemented here.
        </p>
        <Button>Back to Dashboard</Button>
      </div>
    </div>
  );
}