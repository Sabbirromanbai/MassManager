"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { signIn } from "@/lib/auth-client";
import { HeaderActions } from "@/components/header-actions";
import { t } from "@/lib/lang";

type Lang = "bn" | "en";

const fieldClass =
  "glass w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors focus:ring-2 focus:ring-emerald-500 placeholder:text-white/40";

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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 z-0">
        <img
          src="/background.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-emerald-950/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_60%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <img src="/logo.png" alt="Mess Manager" className="size-9 rounded-xl" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                Mess Manager
              </p>
              <p className="text-xs text-white/60">
                {t(lang, "pages.signIn.title")}
              </p>
            </div>
          </div>
          <HeaderActions currentLang={lang} showSignOut={false} />
        </header>

        <div className="glass-strong rounded-2xl border border-white/15 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl md:p-8">
          <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-white">
            {t(lang, "pages.signIn.title")}
          </h1>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/60"
              >
                {t(lang, "auth.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail((event.target as HTMLInputElement).value)}
                required
                placeholder={t(lang, "auth.email")}
                className={fieldClass}
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/60"
              >
                {t(lang, "auth.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword((event.target as HTMLInputElement).value)}
                required
                placeholder="••••••••"
                className={fieldClass}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 text-white transition-colors hover:bg-emerald-500/90 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t(lang, "buttons.signingIn")}
                </span>
              ) : (
                t(lang, "buttons.signIn")
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/70">
            {t(lang, "pages.signIn.noAccount")}
            <a
              href="/sign-up"
              className="font-medium text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
            >
              {t(lang, "pages.signIn.signUpLink")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}