"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    const paramMonth = searchParams.get("month");
    if (paramMonth) {
      setMonth(paramMonth);
    }
  }, [searchParams]);

  function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
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
    <div className="relative">
      <Button
        variant="ghost"
        className="glass-subtle w-full justify-between gap-2 rounded-xl px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{formatMonth(month)}</span>
        <ChevronDown className="size-4 text-emerald-300" />
      </Button>

      {isOpen && (
        <div className="glass-strong absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl border border-white/15 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={goToPrevMonth}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-medium text-white">{formatMonth(month)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={goToNextMonth}
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
                  className={cn(
                    "justify-start rounded-lg px-2 py-1 text-xs transition-colors",
                    isSelected
                      ? "bg-emerald-500 text-white hover:bg-emerald-500/90"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
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