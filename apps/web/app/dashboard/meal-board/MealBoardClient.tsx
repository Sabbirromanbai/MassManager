"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@workspace/ui/components/button";
import { Lang, t } from "@/lib/lang";
import { Member } from "@/lib/models";
import {
  EGG_PRICE_PER_PIECE,
  GUEST_RATE_PER_MEAL,
  getWeekdayKey,
  isFriday,
} from "@/lib/mealBoard";
import { Plus, Minus, Clock, UtensilsCrossed, Egg, Users } from "lucide-react";

export interface GuestEntry {
  date: number;
  meals: number;
  ratePerMeal: number;
}

interface MealBoardClientProps {
  lang: Lang;
  month: string;
  isManager: boolean;
  currentMember: Member;
  regularMembers: Member[];
  eggOnlyMembers: Member[];
  guestMembers: Member[];
  mealsMap: Map<string, number>;
  eggMap: Map<string, number>;
  mealOffMap: Map<string, { status: string; requestId: string }>;
  guestEntries: GuestEntry[];
  days: number[];
  canRequestMealOff: boolean;
  today: number;
  currentUserMealOff: { status: string; requestId: string } | undefined;
  dhakaTime: Date;
}

const cardClass = "glass-strong rounded-xl border border-white/10 p-4 md:p-5 transition-all duration-200";
const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const fieldClass =
  "glass w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors focus:ring-2 focus:ring-emerald-500";
const iconWrapBase =
  "flex size-9 shrink-0 items-center justify-center rounded-lg";

async function readServerError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null && "error" in data) {
      const message = (data as { error?: unknown }).error;
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
    }
  } catch {
    // Fall back to the translated message below.
  }
  return fallback;
}

export function MealBoardClient({
  lang,
  month,
  isManager,
  currentMember,
  regularMembers,
  eggOnlyMembers,
  guestMembers,
  mealsMap,
  eggMap,
  mealOffMap,
  guestEntries,
  days,
  canRequestMealOff,
  today,
  currentUserMealOff,
}: MealBoardClientProps) {
  const initialDay = days.includes(today) ? today : days[0] ?? 1;

  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(String(initialDay));
  const [mealCount, setMealCount] = useState<1 | 2>(2);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [eggDate, setEggDate] = useState<string>(String(initialDay));
  const [eggPieces, setEggPieces] = useState<string>("1");
  const [isAddingEgg, setIsAddingEgg] = useState(false);
  const [isRemovingEgg, setIsRemovingEgg] = useState(false);

  const [guestDate, setGuestDate] = useState<string>(String(initialDay));
  const [guestMealCount, setGuestMealCount] = useState<string>("1");
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [isRemovingGuest, setIsRemovingGuest] = useState(false);

  const [requestingMealOff, setRequestingMealOff] = useState(false);
  const [error, setError] = useState<string>("");
  const [eggError, setEggError] = useState<string>("");
  const [guestError, setGuestError] = useState<string>("");

  const sortedRegularMembers = [...regularMembers].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const selectedMemberName = sortedRegularMembers.find(
    (member) => member._id?.toString() === selectedMemberId
  )?.name;
  const sortedEggMembers = [...eggOnlyMembers].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedGuestMembers = [...guestMembers].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const eggMember = sortedEggMembers[0];
  const guestMember = sortedGuestMembers[0];

  const weekdayShort = (day: number): string => {
    const key = getWeekdayKey(day, month);
    return key ? t(lang, `weekdays.${key}`) : "";
  };

  const weekdayLong = (day: number): string => {
    const key = getWeekdayKey(day, month);
    return key ? t(lang, `weekdaysLong.${key}`) : "";
  };

  const dateOptionLabel = (day: number): string => {
    const weekday = weekdayLong(day);
    return weekday ? `${day} — ${weekday}` : String(day);
  };

  const guestTotalMeals = guestEntries.reduce((sum, entry) => sum + entry.meals, 0);
  const guestTotalAmount = guestEntries.reduce(
    (sum, entry) => sum + entry.meals * entry.ratePerMeal,
    0
  );

  async function handleAddMeal() {
    const date = Number.parseInt(selectedDate, 10);
    if (!selectedMemberId || !Number.isInteger(date)) {
      setError(t(lang, "pages.mealBoard.errorNotManager"));
      return;
    }

    setIsAdding(true);
    setError("");

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          month,
          date,
          count: mealCount,
        }),
      });

      if (!response.ok) {
        setError(
          await readServerError(
            response,
            t(lang, "pages.mealBoard.errorNotManager")
          )
        );
        return;
      }
      window.location.reload();
    } catch {
      setError(t(lang, "pages.mealBoard.errorNotManager"));
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveMeal() {
    const date = Number.parseInt(selectedDate, 10);
    if (!selectedMemberId || !Number.isInteger(date)) {
      setError(t(lang, "pages.mealBoard.errorNotManager"));
      return;
    }

    setIsRemoving(true);
    setError("");

    try {
      const response = await fetch("/api/meals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          month,
          date,
        }),
      });

      if (!response.ok) {
        setError(
          await readServerError(
            response,
            t(lang, "pages.mealBoard.errorMealNotFound")
          )
        );
        return;
      }
      window.location.reload();
    } catch {
      setError(t(lang, "pages.mealBoard.errorMealNotFound"));
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleAddEgg() {
    const date = Number.parseInt(eggDate, 10);
    const pieces = Number.parseInt(eggPieces, 10);
    const eggMemberId = eggMember?._id?.toString();

    if (!eggMemberId || !Number.isInteger(date)) {
      setEggError(t(lang, "pages.mealBoard.errorEggNotManager"));
      return;
    }
    if (!Number.isInteger(pieces) || pieces < 1) {
      setEggError(t(lang, "pages.mealBoard.errorPieces"));
      return;
    }

    setIsAddingEgg(true);
    setEggError("");

    try {
      const response = await fetch("/api/eggs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: eggMemberId,
          month,
          date,
          pieces,
        }),
      });

      if (!response.ok) {
        setEggError(
          await readServerError(
            response,
            t(lang, "pages.mealBoard.errorEggNotManager")
          )
        );
        return;
      }
      window.location.reload();
    } catch {
      setEggError(t(lang, "pages.mealBoard.errorEggNotManager"));
    } finally {
      setIsAddingEgg(false);
    }
  }

  async function handleRemoveEgg() {
    const date = Number.parseInt(eggDate, 10);
    const eggMemberId = eggMember?._id?.toString();

    if (!eggMemberId || !Number.isInteger(date)) {
      setEggError(t(lang, "pages.mealBoard.errorEggNotManager"));
      return;
    }

    setIsRemovingEgg(true);
    setEggError("");

    try {
      const response = await fetch("/api/eggs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: eggMemberId,
          month,
          date,
        }),
      });

      if (!response.ok) {
        setEggError(
          await readServerError(
            response,
            t(lang, "pages.mealBoard.errorEggNotFound")
          )
        );
        return;
      }
      window.location.reload();
    } catch {
      setEggError(t(lang, "pages.mealBoard.errorEggNotFound"));
    } finally {
      setIsRemovingEgg(false);
    }
  }

  async function handleAddGuest() {
    const date = Number.parseInt(guestDate, 10);
    const meals = Number.parseInt(guestMealCount, 10);

    if (!Number.isInteger(date)) {
      setGuestError(t(lang, "pages.mealBoard.errorGuestNotManager"));
      return;
    }
    if (!Number.isInteger(meals) || meals < 1 || meals > 3) {
      setGuestError(t(lang, "pages.mealBoard.errorMeals"));
      return;
    }

    setIsAddingGuest(true);
    setGuestError("");

    try {
      const response = await fetch("/api/guest-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          date,
          meals,
        }),
      });

      if (!response.ok) {
        setGuestError(
          await readServerError(
            response,
            t(lang, "pages.mealBoard.errorGuestNotManager")
          )
        );
        return;
      }
      window.location.reload();
    } catch {
      setGuestError(t(lang, "pages.mealBoard.errorGuestNotManager"));
    } finally {
      setIsAddingGuest(false);
    }
  }

  async function handleRemoveGuest() {
    const date = Number.parseInt(guestDate, 10);

    if (!Number.isInteger(date)) {
      setGuestError(t(lang, "pages.mealBoard.errorGuestNotManager"));
      return;
    }

    setIsRemovingGuest(true);
    setGuestError("");

    try {
      const response = await fetch("/api/guest-meals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          date,
        }),
      });

      if (!response.ok) {
        setGuestError(
          await readServerError(
            response,
            t(lang, "pages.mealBoard.errorGuestNotFound")
          )
        );
        return;
      }
      window.location.reload();
    } catch {
      setGuestError(t(lang, "pages.mealBoard.errorGuestNotFound"));
    } finally {
      setIsRemovingGuest(false);
    }
  }

  async function handleMealOffRequest() {
    setRequestingMealOff(true);
    setError("");

    try {
      const response = await fetch("/api/meal-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: currentMember._id?.toString(),
          month,
          date: today,
        }),
      });

      if (!response.ok) {
        setError(
          await readServerError(
            response,
            t(lang, "pages.mealBoard.mealOffTimeOver")
          )
        );
        return;
      }
      window.location.reload();
    } catch {
      setError(t(lang, "pages.mealBoard.mealOffTimeOver"));
    } finally {
      setRequestingMealOff(false);
    }
  }

  return (
    <div className="space-y-6">
      {isManager && (
        <section className={cn(cardClass, "animate-fade-in-up delay-1")}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className={cn(iconWrapBase, "bg-emerald-500/15 text-emerald-400")}>
              <UtensilsCrossed className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {t(lang, "pages.mealBoard.addMeal")}
              </h3>
              <p className="text-xs text-white/50">
                {t(lang, "pages.mealBoard.mealEntryHint")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-[200px] flex-1">
              <label className={labelClass}>
                {t(lang, "pages.mealBoard.memberDropdownLabel")}
              </label>
              <select
                value={selectedMemberId}
                onChange={(event) => setSelectedMemberId(event.target.value)}
                className={fieldClass}
                disabled={isAdding || isRemoving}
              >
                <option value="" disabled>
                  {t(lang, "pages.mealBoard.memberDropdownLabel")}
                </option>
                {sortedRegularMembers.map((member) => (
                  <option
                    key={member._id?.toString()}
                    value={member._id!.toString()}
                  >
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[170px] flex-1">
              <label className={labelClass}>
                {t(lang, "pages.mealBoard.dateLabel")}
              </label>
              <select
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className={fieldClass}
                disabled={isAdding || isRemoving}
              >
                {days.map((day) => (
                  <option key={day} value={String(day)}>
                    {dateOptionLabel(day)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className={labelClass}>
                {t(lang, "pages.mealBoard.mealsPerEntry")}
              </span>
              <div
                role="group"
                aria-label={t(lang, "pages.mealBoard.mealsPerEntry")}
                className="inline-flex rounded-lg border border-white/15 bg-black/20 p-1"
              >
                {([1, 2] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mealCount === value}
                    onClick={() => setMealCount(value)}
                    className={cn(
                      "min-w-12 rounded-md px-3 py-1.5 text-sm font-semibold transition-all",
                      mealCount === value
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="glass transition-colors hover:bg-white/20"
                onClick={handleAddMeal}
                disabled={isAdding}
              >
                {isAdding ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <Plus className="size-4" />
                )}
                <span>
                  {isAdding ? "..." : t(lang, "pages.mealBoard.addButton")}
                </span>
              </Button>
              <Button
                variant="destructive"
                className="glass border-red-600/30 bg-red-600/20 transition-colors hover:bg-red-600/30"
                onClick={handleRemoveMeal}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <Minus className="size-4" />
                )}
                <span>
                  {isRemoving ? "..." : t(lang, "pages.mealBoard.removeButton")}
                </span>
              </Button>
            </div>
          </div>

          {selectedMemberName && selectedDate && (
            <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {selectedMemberName} · {dateOptionLabel(Number.parseInt(selectedDate, 10))} · {mealCount}{" "}
              {t(lang, "pages.mealBoard.mealsUnit")}
            </p>
          )}

          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          )}
        </section>
      )}

      {isManager && eggMember && (
        <section className={cn(cardClass, "animate-fade-in-up delay-2")}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className={cn(iconWrapBase, "bg-amber-500/15 text-amber-400")}>
              <Egg className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {t(lang, "pages.mealBoard.eggEntry")}
              </h3>
              <p className="text-xs text-white/50">
                {eggMember.name} ·{" "}
                {t(lang, "pages.mealBoard.pricePerPiece")} ৳
                {EGG_PRICE_PER_PIECE}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[170px] flex-1">
              <label className={labelClass}>
                {t(lang, "pages.mealBoard.dateLabel")}
              </label>
              <select
                value={eggDate}
                onChange={(event) => setEggDate(event.target.value)}
                className={fieldClass}
                disabled={isAddingEgg || isRemovingEgg}
              >
                {days.map((day) => (
                  <option key={day} value={String(day)}>
                    {dateOptionLabel(day)}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-32">
              <label className={labelClass}>
                {t(lang, "pages.mealBoard.piecesLabel")}
              </label>
              <input
                type="number"
                min={1}
                value={eggPieces}
                onChange={(event) => setEggPieces(event.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="glass transition-colors hover:bg-white/20"
                onClick={handleAddEgg}
                disabled={isAddingEgg}
              >
                {isAddingEgg ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <Plus className="size-4" />
                )}
                <span>
                  {isAddingEgg ? "..." : t(lang, "pages.mealBoard.addButton")}
                </span>
              </Button>
              <Button
                variant="destructive"
                className="glass border-red-600/30 bg-red-600/20 transition-colors hover:bg-red-600/30"
                onClick={handleRemoveEgg}
                disabled={isRemovingEgg}
              >
                {isRemovingEgg ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <Minus className="size-4" />
                )}
                <span>
                  {isRemovingEgg
                    ? "..."
                    : t(lang, "pages.mealBoard.removeButton")}
                </span>
              </Button>
            </div>
          </div>

          {eggError && (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {eggError}
            </p>
          )}
        </section>
      )}

      {isManager && guestMember && (
        <section className={cn(cardClass, "animate-fade-in-up delay-2")}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className={cn(iconWrapBase, "bg-amber-500/15 text-amber-400")}>
              <Users className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {t(lang, "pages.mealBoard.guestEntry")}
              </h3>
              <p className="text-xs text-white/50">
                {guestMember.name} · ৳{GUEST_RATE_PER_MEAL} /{" "}
                {t(lang, "pages.mealBoard.mealsUnit")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[170px] flex-1">
              <label className={labelClass}>
                {t(lang, "pages.mealBoard.dateLabel")}
              </label>
              <select
                value={guestDate}
                onChange={(event) => setGuestDate(event.target.value)}
                className={fieldClass}
                disabled={isAddingGuest || isRemovingGuest}
              >
                {days.map((day) => (
                  <option key={day} value={String(day)}>
                    {dateOptionLabel(day)}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-32">
              <label className={labelClass}>
                {t(lang, "pages.mealBoard.guestMealsLabel")}
              </label>
              <input
                type="number"
                min={1}
                max={3}
                value={guestMealCount}
                onChange={(event) => setGuestMealCount(event.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="glass transition-colors hover:bg-white/20"
                onClick={handleAddGuest}
                disabled={isAddingGuest}
              >
                {isAddingGuest ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <Plus className="size-4" />
                )}
                <span>
                  {isAddingGuest ? "..." : t(lang, "pages.mealBoard.addButton")}
                </span>
              </Button>
              <Button
                variant="destructive"
                className="glass border-red-600/30 bg-red-600/20 transition-colors hover:bg-red-600/30"
                onClick={handleRemoveGuest}
                disabled={isRemovingGuest}
              >
                {isRemovingGuest ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <Minus className="size-4" />
                )}
                <span>
                  {isRemovingGuest
                    ? "..."
                    : t(lang, "pages.mealBoard.removeButton")}
                </span>
              </Button>
            </div>
          </div>

          {guestError && (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {guestError}
            </p>
          )}
        </section>
      )}

      <section className="glass-strong overflow-x-auto rounded-xl border border-white/10 p-4 animate-fade-in-up delay-1">
        <h3 className="mb-3 text-lg font-semibold text-white">
          {t(lang, "pages.mealBoard.registerGrid")}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm text-white/90">
            <thead>
              <tr className="border-b border-white/20">
                <th className="sticky left-0 z-10 bg-white/10 backdrop-blur-sm p-2 font-medium text-white/70">
                  {t(lang, "pages.mealBoard.memberTotal")}
                </th>
                {days.map((day) => {
                  const friday = isFriday(day, month);
                  return (
                    <th
                      key={day}
                      className={cn(
                        "p-2 text-center align-bottom font-medium",
                        friday
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "text-white/70"
                      )}
                    >
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="flex items-center gap-1 text-sm">
                          {day}
                          {friday && (
                            <span
                              className="size-1.5 rounded-full bg-emerald-400"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-normal uppercase tracking-wide",
                            friday ? "text-emerald-300/80" : "text-white/40"
                          )}
                        >
                          {weekdayShort(day)}
                        </span>
                      </span>
                    </th>
                  );
                })}
                <th className="sticky right-0 z-10 bg-white/10 backdrop-blur-sm p-2 font-medium text-white/70">
                  {t(lang, "pages.mealBoard.memberTotal")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRegularMembers.map((member) => {
                const memberId = member._id?.toString() ?? "";
                return (
                  <tr
                    key={memberId}
                    className="border-b border-white/10 transition-colors hover:bg-white/5"
                  >
                    <td className="sticky left-0 z-10 bg-white/10 backdrop-blur-sm p-2 font-medium">
                      {member.name}
                    </td>
                    {days.map((day) => {
                      const key = `${memberId}-${day}`;
                      const count = mealsMap.get(key);
                      const mealOff = mealOffMap.get(key) ?? null;
                      const isOff =
                        mealOff?.status === "pending" ||
                        mealOff?.status === "done";

                      return (
                        <td key={day} className="relative p-2 text-center">
                          {isOff ? (
                            <span className="text-xs text-yellow-400">
                              {mealOff?.status === "done" ? "✓" : "○"}
                            </span>
                          ) : (
                            <span
                              className={cn(
                                "font-medium",
                                day === today
                                  ? "rounded bg-emerald-500/20 px-1.5 py-0.5"
                                  : "",
                                count === undefined
                                  ? "text-white/40"
                                  : "text-white"
                              )}
                            >
                              {count ?? "—"}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 bg-white/10 backdrop-blur-sm p-2 text-right font-bold">
                      {days.reduce(
                        (sum, day) => sum + (mealsMap.get(`${memberId}-${day}`) ?? 0),
                        0
                      )}
                    </td>
                  </tr>
                );
              })}

              {sortedEggMembers.length > 0 ? (
                <>
                  <tr className="bg-emerald-500/10">
                    <td
                      colSpan={days.length + 2}
                      className="p-2 font-semibold text-emerald-400"
                    >
                      {t(lang, "pages.mealBoard.eggCount")}
                    </td>
                  </tr>
                  {sortedEggMembers.map((member) => {
                    const memberId = member._id?.toString() ?? "";
                    return (
                      <tr
                        key={memberId}
                        className="border-b border-white/10 transition-colors hover:bg-white/5"
                      >
                        <td className="sticky left-0 z-10 bg-white/10 backdrop-blur-sm p-2 font-medium">
                          {member.name}
                        </td>
                        {days.map((day) => {
                          const pieces = eggMap.get(`${memberId}-${day}`);
                          return (
                            <td key={day} className="p-2 text-center">
                              <span
                                className={cn(
                                  "font-medium",
                                  day === today
                                    ? "rounded bg-emerald-500/20 px-1.5 py-0.5"
                                    : "",
                                  pieces === undefined
                                    ? "text-white/40"
                                    : "text-emerald-400"
                                )}
                              >
                                {pieces ?? "—"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="sticky right-0 z-10 bg-white/10 backdrop-blur-sm p-2 text-right font-bold text-emerald-400">
                          {days.reduce(
                            (sum, day) => sum + (eggMap.get(`${memberId}-${day}`) ?? 0),
                            0
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </>
              ) : null}

              <tr className="bg-white/10 font-bold">
                <td className="sticky left-0 z-10 bg-white/10 backdrop-blur-sm p-2">
                  {t(lang, "pages.mealBoard.dailyTotal")}
                </td>
                {days.map((day) => (
                  <td key={day} className="p-2 text-center">
                    {sortedRegularMembers.reduce(
                      (sum, member) =>
                        sum +
                        (mealsMap.get(`${member._id?.toString() ?? ""}-${day}`) ??
                          0),
                      0
                    )}
                  </td>
                ))}
                <td className="sticky right-0 z-10 bg-white/10 backdrop-blur-sm p-2 text-right">
                  {days.reduce(
                    (sum, day) =>
                      sum +
                      sortedRegularMembers.reduce(
                        (memberSum, member) =>
                          memberSum +
                          (mealsMap.get(
                            `${member._id?.toString() ?? ""}-${day}`
                          ) ?? 0),
                        0
                      ),
                    0
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {guestMember && (
        <section className={cn(cardClass, "animate-fade-in-up delay-2")}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className={cn(iconWrapBase, "bg-amber-500/15 text-amber-400")}>
              <Users className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {t(lang, "pages.mealBoard.guestSection")}
              </h3>
              <p className="text-xs text-white/50">{guestMember.name}</p>
            </div>
          </div>

          {guestEntries.length === 0 ? (
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50">
              {t(lang, "pages.mealBoard.guestNoEntries")}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {guestEntries.map((entry) => (
                  <div
                    key={entry.date}
                    className="glass flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-white/15"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/20 text-sm font-medium text-amber-300">
                        {guestMember.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {dateOptionLabel(entry.date)}
                        </p>
                        <p className="text-xs text-white/60">
                          {entry.meals} {t(lang, "pages.mealBoard.mealsUnit")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-300">
                        ৳{entry.meals * entry.ratePerMeal}
                      </p>
                      <p className="text-xs text-white/50">
                        {entry.meals} × ৳{entry.ratePerMeal}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm">
                <span className="text-white/70">
                  {t(lang, "pages.mealBoard.guestTotal")}
                </span>
                <span className="font-semibold text-amber-300">
                  {guestTotalMeals} {t(lang, "pages.mealBoard.mealsUnit")} · ৳
                  {guestTotalAmount}
                </span>
              </div>
            </>
          )}
        </section>
      )}

      {mealOffMap.size > 0 && isManager && (
        <section className={cn(cardClass, "animate-fade-in-up delay-3")}>
          <h3 className="mb-3 text-lg font-semibold text-white">
            {t(lang, "pages.mealBoard.mealOffRequestsList")}
          </h3>
          <div className="space-y-2">
            {Array.from(mealOffMap.entries()).map(([key, value]) => {
              const [memberId, dateStr] = key.split("-");
              const member = regularMembers.find(
                (m) => m._id?.toString() === memberId
              );
              return (
                <div
                  key={key}
                  className="glass flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-white/15"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/20">
                      <span className="text-sm font-medium text-emerald-400">
                        {member?.name?.charAt(0) ?? "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {member?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-white/60">
                        {t(lang, "pages.mealBoard.date")} {dateStr}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-2 py-1 text-xs font-medium",
                        value.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      )}
                    >
                      {t(lang, `pages.mealBoard.${value.status}`)}
                    </span>
                    {value.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="glass"
                        onClick={async () => {
                          const res = await fetch("/api/meal-off", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ requestId: value.requestId }),
                          });
                          if (res.ok) window.location.reload();
                        }}
                      >
                        {t(lang, "pages.mealBoard.markDone")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!isManager && (
        <section className={cn(cardClass, "animate-fade-in-up delay-2")}>
          <h3 className="mb-3 text-lg font-semibold text-white">
            {t(lang, "pages.mealBoard.mealOffRequest")}
          </h3>
          {currentUserMealOff ? (
            <div className="glass flex items-center justify-between rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Clock className="size-5 text-yellow-400" />
                <div>
                  <p className="font-medium text-white">
                    {t(lang, "pages.mealBoard.mealOffRequested")}
                  </p>
                  <p className="text-xs text-white/60">
                    {currentUserMealOff.status === "done"
                      ? t(lang, "pages.mealBoard.done")
                      : t(lang, "pages.mealBoard.pending")}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium",
                  currentUserMealOff.status === "pending"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-emerald-500/20 text-emerald-400"
                )}
              >
                {t(lang, `pages.mealBoard.${currentUserMealOff.status}`)}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-white/70">
                {t(lang, "pages.mealBoard.mealOffButton")}
              </p>
              <Button
                className="glass w-full"
                onClick={handleMealOffRequest}
                disabled={requestingMealOff || !canRequestMealOff}
              >
                {requestingMealOff ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  t(lang, "pages.mealBoard.mealOffButton")
                )}
              </Button>
              {!canRequestMealOff && (
                <p className="text-sm text-red-400">
                  {t(lang, "pages.mealBoard.mealOffTimeOver")}
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
