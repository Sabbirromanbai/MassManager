"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "cn";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const monthNum = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${monthNum}`;
}

function parseMonth(monthStr: string): { year: number; month: number } {
  const parts = monthStr.split("-");
  const yearStr = parts[0];
  const monthStrNum = parts[1];
  if (!yearStr || !monthStrNum) {
    throw new Error(`Invalid month format: ${monthStr}`);
  }
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStrNum, 10),
  };
}

function formatMonth(monthStr: string): string {
  const { year, month } = parseMonth(monthStr);
  const date = new Date(year, month - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

function getPrevMonth(monthStr: string): string {
  const { year, month } = parseMonth(monthStr);
  const prevDate = new Date(year, month - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
}

function getNextMonth(monthStr: string): string {
  const { year, month } = parseMonth(monthStr);
  const nextDate = new Date(year, month, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthSelector() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [month, setMonth] = useState<string>(getCurrentMonthString());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paramMonth = searchParams.get("month");
    if (paramMonth) {
      setMonth(paramMonth);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth);
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToPrevMonth() {
    if (!month) return;
    handleMonthChange(getPrevMonth(month));
  }

  function goToNextMonth() {
    if (!month) return;
    handleMonthChange(getNextMonth(month));
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        className="glass-subtle w-full justify-between gap-2 rounded-xl px-3 py-2 text-sm app-text transition-colors hover:app-surface-strong"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Select month: ${formatMonth(month)}`}
      >
        <span className="truncate font-medium">{formatMonth(month)}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 app-text-emerald transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Select month"
          className="glass-strong absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border app-border p-3 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="app-text hover:app-surface-strong"
              onClick={goToPrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="truncate text-sm font-medium app-text">{formatMonth(month)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="app-text hover:app-surface-strong"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid max-h-60 grid-cols-3 gap-1 overflow-y-auto">
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, "0");
              const year = parseMonth(month).year;
              const optionMonth = `${year}-${m}`;
              const isSelected = optionMonth === month;
              return (
                <Button
                  key={optionMonth}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  aria-pressed={isSelected}
                  className={cn(
                    "justify-start rounded-lg px-2 py-1 text-xs transition-colors",
                    isSelected
                      ? "bg-emerald-500 text-white hover:bg-emerald-500/90"
                      : "app-text hover:app-surface-strong hover:app-text"
                  )}
                  onClick={() => handleMonthChange(optionMonth)}
                >
                  {new Date(year, i).toLocaleString("default", { month: "short" })}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
