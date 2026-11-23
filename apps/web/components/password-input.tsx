"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "cn";
import { Lang, t } from "@/lib/lang";

const fieldClass =
  "glass w-full min-w-0 rounded-xl px-3 py-2.5 pr-10 text-sm app-text outline-none transition-colors focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-60 placeholder:app-text-faint";

interface PasswordInputProps {
  lang: Lang;
  value: string;
  onChange: (value: string) => void;
  id: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function PasswordInput({
  lang,
  value,
  onChange,
  id,
  autoComplete,
  required,
  minLength,
  placeholder = "••••••••",
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange((event.target as HTMLInputElement).value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={cn(fieldClass)}
        disabled={disabled}
      />
      <button
        type="button"
        aria-label={t(lang, visible ? "auth.hidePassword" : "auth.showPassword")}
        aria-pressed={visible}
        onClick={() => setVisible((previous) => !previous)}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-lg text-app-muted transition-colors hover:text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:pointer-events-none disabled:opacity-60"
      >
        {visible ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  );
}
