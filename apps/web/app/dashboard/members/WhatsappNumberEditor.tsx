"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Lang, t } from "@/lib/lang";
import { formatBangladeshMobile, normalizeBangladeshMobile } from "@/lib/phone";
import { Pencil } from "lucide-react";

interface WhatsappNumberEditorProps {
  memberId: string;
  initialNumber: string | null;
  lang: Lang;
}

export function WhatsappNumberEditor({
  memberId,
  initialNumber,
  lang,
}: WhatsappNumberEditorProps) {
  const [current, setCurrent] = useState<string | null>(initialNumber);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function save(raw: string) {
    const trimmed = raw.trim();
    const normalized = trimmed === "" ? null : normalizeBangladeshMobile(trimmed);
    if (trimmed !== "" && !normalized) {
      setError(t(lang, "pages.members.whatsappInvalid"));
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, whatsappNumber: trimmed }),
      });
      if (!response.ok) {
        let fallback = t(lang, "pages.members.whatsappSaveFailed");
        try {
          const data: unknown = await response.json();
          if (typeof data === "object" && data !== null && "error" in data) {
            const message = (data as { error?: unknown }).error;
            if (typeof message === "string" && message) fallback = message;
          }
        } catch {
          // Keep the translated fallback.
        }
        throw new Error(fallback);
      }

      setCurrent(normalized);
      setValue(normalized ?? "");
      setEditing(false);
      setNotice(t(lang, "pages.members.whatsappSaved"));
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : t(lang, "pages.members.whatsappSaveFailed")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 border-t app-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide app-text-faint">
            {t(lang, "pages.members.whatsappNumber")}
          </p>
          <p
            className="truncate text-sm app-text"
            title={current ? formatBangladeshMobile(current) : undefined}
          >
            {current
              ? formatBangladeshMobile(current)
              : t(lang, "pages.members.whatsappNotSet")}
          </p>
        </div>
        {!editing && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              setValue(current ?? "");
              setNotice("");
              setError("");
              setEditing(true);
            }}
            aria-label={t(lang, "pages.members.whatsappEdit")}
          >
            <Pencil className="size-3" />
            <span className="hidden sm:inline">
              {t(lang, "pages.members.whatsappEdit")}
            </span>
          </Button>
        )}
      </div>

      {editing && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save(value);
          }}
          className="mt-2 space-y-2"
        >
          <input
            type="tel"
            inputMode="tel"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="01712-345678"
            aria-label={t(lang, "pages.members.whatsappNumber")}
            className="glass w-full rounded-lg px-2.5 py-1.5 text-xs app-text outline-none transition-colors focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60"
            disabled={saving}
          />
          <p className="text-[10px] app-text-faint">
            {t(lang, "pages.members.whatsappHint")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="submit"
              size="xs"
              className="app-primary-button"
              disabled={saving}
            >
              {saving ? "..." : t(lang, "pages.members.whatsappSave")}
            </Button>
            {current && (
              <Button
                type="button"
                size="xs"
                variant="destructive"
                disabled={saving}
                onClick={() => void save("")}
              >
                {t(lang, "pages.members.whatsappRemove")}
              </Button>
            )}
            <Button
              type="button"
              size="xs"
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setNotice("");
                setError("");
              }}
            >
              {t(lang, "pages.members.whatsappCancel")}
            </Button>
          </div>
        </form>
      )}

      {notice && (
        <p role="status" className="mt-1.5 text-[11px] app-text-emerald">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-[11px] app-text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
