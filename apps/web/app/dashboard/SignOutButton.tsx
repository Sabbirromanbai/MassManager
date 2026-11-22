"use client";

import { signOut } from "@/lib/auth-client";
import { Button } from "@workspace/ui/components/button";

export function SignOutButton() {
  async function handleSignOut() {
    await signOut();
    window.location.href = "/sign-in";
  }

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}