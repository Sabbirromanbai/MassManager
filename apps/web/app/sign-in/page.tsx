"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { signIn } from "@/lib/auth-client";
import { HeaderActions } from "@/components/header-actions";
import { t } from "@/lib/lang";

type Lang = "bn" | "en";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Lang>("bn");

  useEffect(() => {
    const cookieLang = document.cookie.split("; ").find((row) => row.startsWith("lang="));
    if (cookieLang) {
      const value = cookieLang.split("=")[1];
      if (value === "bn" || value === "en") {
        setLang(value);
      }
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? t(lang, "pages.signIn.failed"));
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 z-0">
        <img
          src="/background.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <header className="flex justify-between items-center mb-6">
          <div className="flex justify-center">
            <img src="/logo.png" alt="Mess Manager" className="size-16 rounded" />
          </div>
          <HeaderActions currentLang={lang} showSignOut={false} />
        </header>
        <div className="glass p-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-white">{t(lang, "pages.signIn.title")}</h1>

          {error && (
            <div className="mb-4 p-3 bg-destructive/20 border border-destructive/30 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-white/90">
                {t(lang, "auth.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail((event.target as HTMLInputElement).value)}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder:text-white/50"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-white/90">
                {t(lang, "auth.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword((event.target as HTMLInputElement).value)}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder:text-white/50"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t(lang, "buttons.signingIn") : t(lang, "buttons.signIn")}
            </Button>
          </form>

          <p className="text-center text-sm text-white/70 mt-6">
            {t(lang, "pages.signIn.noAccount")}
            <a href="/sign-up" className="text-emerald-400 hover:underline">
              {t(lang, "pages.signIn.signUpLink")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}