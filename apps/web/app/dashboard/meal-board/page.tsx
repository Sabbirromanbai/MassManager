import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";

export default function MealBoardPage() {
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
            <UtensilsCrossed className="size-6" />
            Meal Board
          </h1>
          <p className="text-muted-foreground">Daily meal entry and meal off requests</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <UtensilsCrossed className="size-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground mb-6">
          Meal board functionality will be implemented here.
        </p>
        <Button>Back to Dashboard</Button>
      </div>
    </div>
  );
}