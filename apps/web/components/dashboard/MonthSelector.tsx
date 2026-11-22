"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
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
        variant="outline"
        className="w-full justify-between gap-2 px-3 py-2 text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{formatMonth(month)}</span>
        <ChevronDown className="size-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-medium">{formatMonth(month)}</span>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1 max-h-60 overflow-y-auto">
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, "0");
              const year = parseMonth(month).year;
              const optionMonth = `${year}-${m}`;
              return (
                <Button
                  key={optionMonth}
                  variant={optionMonth === month ? "default" : "ghost"}
                  size="sm"
                  className="justify-start px-2 py-1 text-xs"
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