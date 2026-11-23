"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Button } from "@workspace/ui/components/button";
import { Lang, t } from "@/lib/lang";
import type { MemberSettlement } from "@/lib/stats";
import type { SerializedOfficeLoan } from "@/lib/officeLoans";
import { createReportPdfFile, downloadReportPdf, warmReportPdf } from "@/lib/reportPdf";
import { REPORT_SHEET_CSS } from "@/lib/reportSheetCss";
import {
  buildReportFileName,
  buildWhatsappLink,
  buildWhatsappSummary,
} from "@/lib/whatsappShare";
import { formatBangladeshMobile, normalizeBangladeshMobile } from "@/lib/phone";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import {
  UtensilsCrossed,
  Scale,
  Receipt,
  Wallet,
  TrendingUp,
  Printer,
  Share2,
  Send,
  Download,
} from "lucide-react";

interface MemberReportClientProps {
  lang: Lang;
  month: string;
  isManager: boolean;
  currentMemberId: string;
  members: MemberSettlement[];
  whatsappNumbers: Record<string, string | null>;
}

export interface MemberReportLoanSummary {
  loanCount: number;
  totalLoaned: number;
  totalRepaid: number;
  remainingBalance: number;
}

interface MemberReportData {
  memberName: string;
  memberType: MemberSettlement["memberType"];
  month: string;
  meals: number;
  averageRate: number | null;
  mealCost: number;
  advance: number;
  due: number;
  eggPieces: number;
  eggCost: number;
  guestMeals: number;
  guestCost: number;
  loanSummary: MemberReportLoanSummary | null;
}

type StatTone = "emerald" | "orange" | "danger" | "faint";

const TONE_COLORS: Record<StatTone, string> = {
  emerald: "#047857",
  orange: "#b45309",
  danger: "#b91c1c",
  faint: "#9ca3af",
};

const TONE_TINTS: Record<StatTone, string> = {
  emerald: "#d1fae5",
  orange: "#fef3c7",
  danger: "#fee2e2",
  faint: "#f3f4f6",
};

function formatAmount(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV !== "production") {
    console.log("[member-report-share]", ...args);
  }
}

/** Keep balances free of floating-point noise (mirrors the shared office loan helper). */
function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumRepayments(loan: SerializedOfficeLoan): number {
  return roundMoney(
    loan.repayments.reduce((sum, repayment) => sum + repayment.amount, 0)
  );
}

function zeroOrAmount(value: number, lang: Lang): string {
  return value > 0 ? formatAmount(value, lang) : "—";
}

function badgeLabel(lang: Lang, type: MemberSettlement["memberType"]): string {
  return t(lang, `badges.${type}`);
}

export function MemberReportClient({
  lang,
  month,
  isManager,
  currentMemberId,
  members,
  whatsappNumbers,
}: MemberReportClientProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const [shareError, setShareError] = useState("");
  const latestRef = useRef<{
    data: MemberReportData | null;
    members: MemberSettlement[];
    whatsappNumbers: Record<string, string | null>;
    lang: Lang;
    month: string;
    isManager: boolean;
    currentMemberId: string;
    loansLoaded: boolean;
    officeLoans: SerializedOfficeLoan[];
  }>({
    data: null,
    members: [],
    whatsappNumbers: {},
    lang,
    month,
    isManager,
    currentMemberId,
    loansLoaded: false,
    officeLoans: [],
  });
  const [sendAllPhase, setSendAllPhase] = useState<
    "idle" | "running" | "done"
  >("idle");
  const [sendAllQueue, setSendAllQueue] = useState<string[]>([]);
  const [sendAllStatus, setSendAllStatus] = useState<Record<string, string>>({});

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (!isManager) return currentMemberId;
    const own = members.find((m) => m.memberId === currentMemberId);
    return own?.memberId ?? members[0]?.memberId ?? "";
  });

  useEffect(() => {
    // Changing the month re-fetches the settlement and can flip isManager;
    // make sure the selected member is still one this page is allowed to show.
    setSelectedId((current) => {
      if (!isManager) return currentMemberId;
      if (members.some((member) => member.memberId === current)) return current;
      return (
        members.find((member) => member.memberId === currentMemberId)
          ?.memberId ??
        members[0]?.memberId ??
        ""
      );
    });
  }, [isManager, currentMemberId, members]);

  const [officeLoans, setOfficeLoans] = useState<SerializedOfficeLoan[]>([]);
  const [loansLoaded, setLoansLoaded] = useState(false);

  useEffect(() => {
    setLoansLoaded(false);
    if (!isManager) return;
    let cancelled = false;
    fetch("/api/office-loans", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (
          ((await response.json()) as { loans?: SerializedOfficeLoan[] }) ??
          null
        );
      })
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.loans)) {
          setOfficeLoans(data.loans);
        }
        if (!cancelled) setLoansLoaded(true);
      })
      .catch(() => {
        // The settlement data still prints if loans fail to load.
      });
    return () => {
      cancelled = true;
    };
  }, [isManager]);

  const report = useMemo(
    () => members.find((m) => m.memberId === selectedId) ?? null,
    [members, selectedId]
  );

  const isOwnReport = isManager && report?.memberId === currentMemberId;

  const averageRate = useMemo(() => {
    if (!report || report.meals <= 0) return null;
    return report.mealCost / report.meals;
  }, [report]);

  const loanSummary = useMemo<MemberReportLoanSummary | null>(() => {
    if (!isOwnReport || !loansLoaded) return null;
    const loans = officeLoans;
    const totalLoaned = roundMoney(
      loans.reduce((sum, loan) => sum + loan.amount, 0)
    );
    const totalRepaid = roundMoney(
      loans.reduce((sum, loan) => sum + sumRepayments(loan), 0)
    );
    const remainingBalance = roundMoney(
      loans.reduce(
        (sum, loan) => sum + (loan.amount - sumRepayments(loan)),
        0
      )
    );
    return {
      loanCount: loans.length,
      totalLoaned,
      totalRepaid,
      remainingBalance,
    };
  }, [isOwnReport, loansLoaded, officeLoans]);

  const data = useMemo<MemberReportData | null>(() => {
    if (!report) return null;
    return {
      memberName: report.memberName,
      memberType: report.memberType,
      month,
      meals: report.meals,
      averageRate,
      mealCost: report.mealCost,
      advance: report.advance,
      due: report.due,
      eggPieces: report.eggPieces,
      eggCost: report.eggCost,
      guestMeals: report.guestMeals,
      guestCost: report.guestCost,
      loanSummary,
    };
  }, [report, averageRate, loanSummary, month]);

  latestRef.current = {
    data,
    members,
    whatsappNumbers,
    lang,
    month,
    isManager,
    currentMemberId,
    loansLoaded,
    officeLoans,
  };

  const ownName = members.find((m) => m.memberId === currentMemberId)
    ?.memberName;

  // All values come from the already-computed report data; nothing is recalculated.
  const whatsappSummary = useMemo(() => {
    if (!data) return "";
    return buildWhatsappSummary(t(lang, "pages.memberReport.whatsappSummary"), {
      memberName: data.memberName,
      month: data.month,
      meals: data.meals > 0 ? String(data.meals) : "—",
      averageRate:
        data.averageRate !== null ? formatAmount(data.averageRate, lang) : "—",
      mealCost: data.mealCost > 0 ? formatAmount(data.mealCost, lang) : "—",
      advance: data.advance > 0 ? formatAmount(data.advance, lang) : "—",
      due: formatAmount(data.due, lang),
    });
  }, [data, lang]);

  const whatsappLink = useMemo(
    () =>
      buildWhatsappLink(
        whatsappNumbers[selectedId] ?? null,
        whatsappSummary
      ),
    [whatsappNumbers, selectedId, whatsappSummary]
  );

  const runShareFlow = async (
    lang: Lang,
    summary: string,
    fileName: string
  ): Promise<
    "shared" | "downloaded" | "aborted" | "failed" | "captureFailed"
  > => {
    const sheet = sheetRef.current;
    devLog("share flow: sheet lookup", Boolean(sheet), sheet?.className ?? "none");
    if (!sheet) return "failed";

    let file: File;
    try {
      file = await createReportPdfFile(sheet, fileName);
    } catch (error) {
      devLog("share flow: pdf generation failed", error);
      return "captureFailed";
    }

    let canShareFiles = false;
    if (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function"
    ) {
      try {
        canShareFiles = navigator.canShare({ files: [file] });
      } catch (error) {
        devLog("share flow: canShare threw", error);
        canShareFiles = false;
      }
    }
    devLog("share flow: canShare result", canShareFiles);

    if (canShareFiles) {
      try {
        devLog("share flow: navigator.share call", fileName);
        await navigator.share({
          files: [file],
          title: t(lang, "pages.memberReport.shareTitle"),
          text: summary,
        });
        devLog("share flow: navigator.share resolved", "shared");
        return "shared";
      } catch (caught) {
        devLog("share flow: navigator.share rejected", caught);
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return "aborted";
        }
        // Fall through to the download fallback below.
      }
    }

    try {
      downloadReportPdf(file);
      return "downloaded";
    } catch (error) {
      devLog("share flow: download fallback failed", error);
      return "failed";
    }
  };

  const handleShare = useCallback(
    async (memberId: string): Promise<boolean> => {
      const state = latestRef.current;
      const rep = state.members.find((m) => m.memberId === memberId) ?? null;
      if (!rep) {
        setShareError(t(state.lang, "pages.memberReport.shareFailed"));
        return false;
      }
      const averageRate = rep.meals > 0 ? rep.mealCost / rep.meals : null;
      const summary = buildWhatsappSummary(
        t(state.lang, "pages.memberReport.whatsappSummary"),
        {
          memberName: rep.memberName,
          month: state.month,
          meals: rep.meals > 0 ? String(rep.meals) : "—",
          averageRate:
            averageRate !== null ? formatAmount(averageRate, state.lang) : "—",
          mealCost: rep.mealCost > 0 ? formatAmount(rep.mealCost, state.lang) : "—",
          advance: rep.advance > 0 ? formatAmount(rep.advance, state.lang) : "—",
          due: formatAmount(rep.due, state.lang),
        }
      );
      const link = buildWhatsappLink(
        state.whatsappNumbers[memberId] ?? null,
        summary
      );
      if (!link) {
        setShareError(t(state.lang, "pages.memberReport.shareNoNumber"));
        return false;
      }

      setSharing(true);
      setShareNotice("");
      setShareError("");
      const result = await runShareFlow(
        state.lang,
        summary,
        buildReportFileName(rep.memberName, state.month)
      );
      setSharing(false);

      if (result === "shared") {
        setShareNotice(t(state.lang, "pages.memberReport.shareOpened"));
        return true;
      }
      if (result === "downloaded") {
        setShareNotice(t(state.lang, "pages.memberReport.downloadDone"));
        return true;
      }
      if (result === "captureFailed") {
        setShareError(t(state.lang, "pages.memberReport.shareFailed"));
        return false;
      }
      if (result === "failed") {
        setShareError(t(state.lang, "pages.memberReport.shareFailed"));
        return false;
      }
      return false;
    },
    []
  );

  async function handleDownload() {
    const sheet = sheetRef.current;
    if (!sheet || !data) return;
    setDownloading(true);
    setShareError("");
    try {
      const file = await createReportPdfFile(
        sheet,
        buildReportFileName(data.memberName, data.month)
      );
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setShareError(t(lang, "pages.memberReport.shareFailed"));
    } finally {
      setDownloading(false);
    }
  }

  const sendAllBusy = sendAllPhase === "running";

  const sendAllEntries = useMemo(() => {
    const list: Array<{
      memberId: string;
      memberName: string;
      number: string | null;
      status: string;
    }> = [];
    for (const member of members) {
      if (member.memberType !== "regular") continue;
      const number = whatsappNumbers[member.memberId] ?? null;
      const normalized = number ? normalizeBangladeshMobile(number) : null;
      list.push({
        memberId: member.memberId,
        memberName: member.memberName,
        number: normalized,
        status: normalized ? "ready" : "missing",
      });
    }
    return list.sort((a, b) => a.memberName.localeCompare(b.memberName));
  }, [members, whatsappNumbers]);

  const sendAllStats = useMemo(() => {
    const statuses = Object.values(sendAllStatus);
    return {
      total: sendAllEntries.length,
      ready: sendAllEntries.filter((e) => e.status === "ready").length,
      missing: sendAllEntries.filter((e) => e.status === "missing").length,
      opened: statuses.filter((s) => s === "opened").length,
      failed: statuses.filter((s) => s === "failed").length,
    };
  }, [sendAllEntries, sendAllStatus]);

  useEffect(() => {
    if (sendAllPhase !== "running") return;
    if (sendAllQueue.length === 0) {
      setSendAllPhase("done");
      return;
    }
    const memberId = sendAllQueue[0];
    if (!memberId) {
      setSendAllPhase("done");
      return;
    }
    let cancelled = false;
    void (async () => {
      const ok = await handleShare(memberId);
      if (cancelled) return;
      setSendAllStatus((prev) => ({
        ...prev,
        [memberId]: ok ? "opened" : "failed",
      }));
      if (ok) {
        setSendAllQueue((prev) => prev.slice(1));
      } else {
        setSendAllQueue([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sendAllPhase, sendAllQueue, handleShare]);

  const sendAllStatusLabel = (status: string): string => {
    switch (status) {
      case "ready":
        return t(lang, "pages.memberReport.sendAllStatusReady");
      case "missing":
        return t(lang, "pages.memberReport.sendAllStatusMissing");
      case "opened":
        return t(lang, "pages.memberReport.sendAllStatusOpened");
      default:
        return t(lang, "pages.memberReport.sendAllFailed");
    }
  };

  async function handleSendAll() {
    const ready = sendAllEntries.filter((e) => e.status === "ready");
    setSendAllStatus(() => {
      const next: Record<string, string> = {};
      for (const entry of sendAllEntries) {
        next[entry.memberId] = entry.status;
      }
      return next;
    });
    if (ready.length === 0) {
      setSendAllQueue([]);
      setSendAllPhase("idle");
      return;
    }
    setSendAllQueue(ready.map((e) => e.memberId));
    setSendAllPhase("running");
  }

  async function handleSendOne(memberId: string) {
    const entry = sendAllEntries.find((e) => e.memberId === memberId);
    if (!entry || entry.status !== "ready") return;
    const ok = await handleShare(memberId);
    setSendAllStatus((prev) => ({
      ...prev,
      [memberId]: ok ? "opened" : "failed",
    }));
  }

  return (
    <div className="space-y-4">
      <div className="member-report-toolbar glass-strong rounded-2xl border app-border p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {isManager ? (
            <div className="flex items-center gap-2">
              <label
                htmlFor="member-report-member"
                className="shrink-0 text-xs font-medium uppercase tracking-wide app-text-muted"
              >
                {t(lang, "pages.memberReport.memberLabel")}
              </label>
              <select
                id="member-report-member"
                value={selectedId}
                onChange={(event) =>
                  setSelectedId((event.target as HTMLSelectElement).value)
                }
                disabled={members.length === 0}
                className="glass w-full min-w-0 rounded-xl px-3 py-2.5 text-sm app-text outline-none transition-colors focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={t(lang, "pages.memberReport.selectMember")}
              >
                {members.map((member) => (
                  <option key={member.memberId} value={member.memberId}>
                    {member.memberName}
                  </option>
                ))}
                {members.length === 0 && (
                  <option value="">
                    {t(lang, "pages.memberReport.noMembers")}
                  </option>
                )}
              </select>
            </div>
          ) : (
            <span className="text-xs font-medium uppercase tracking-wide app-text-muted">
              {t(lang, "pages.memberReport.memberLabel")}: {ownName ?? "—"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <MonthSelector />
          </div>
          <div className="flex w-full flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="rounded-xl"
            >
              <Printer className="size-4" />
              {t(lang, "pages.memberReport.print")}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleDownload()}
              onPointerEnter={warmReportPdf}
              onFocus={warmReportPdf}
              disabled={downloading || sharing || !data}
              className="rounded-xl"
            >
              {downloading ? (
                <span className="app-spinner" aria-hidden="true" />
              ) : (
                <Download className="size-4" />
              )}
              <span>
                {downloading
                  ? t(lang, "pages.memberReport.sharePreparing")
                  : t(lang, "pages.memberReport.download")}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedId) void handleShare(selectedId);
              }}
              onPointerEnter={warmReportPdf}
              onFocus={warmReportPdf}
              disabled={!whatsappLink || sharing || !data}
              className="rounded-xl"
              title={
                !whatsappLink
                  ? t(lang, "pages.memberReport.shareNoNumber")
                  : undefined
              }
            >
              {sharing ? (
                <span className="app-spinner" aria-hidden="true" />
              ) : (
                <Share2 className="size-4" />
              )}
              <span>
                {sharing
                  ? t(lang, "pages.memberReport.sharePreparing")
                  : t(lang, "pages.memberReport.share")}
              </span>
            </Button>
          </div>
        </div>

        {!whatsappLink && data && (
          <p
            role="status"
            className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs app-text-warning"
          >
            {t(lang, "pages.memberReport.shareNoNumber")}
          </p>
        )}
        {shareNotice && (
          <p
            role="status"
            className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs app-text-emerald"
          >
            {shareNotice}
          </p>
        )}
        {shareError && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs app-text-warning"
          >
            <p>{shareError}</p>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block font-semibold underline underline-offset-2"
              >
                {t(lang, "pages.memberReport.shareWhatsappLink")}
              </a>
            )}
            <p className="mt-1 opacity-80">
              {t(lang, "pages.memberReport.shareNote")}
            </p>
          </div>
        )}
        {!shareError && whatsappLink && (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] app-text-faint">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold app-text-emerald underline underline-offset-2"
            >
              {t(lang, "pages.memberReport.shareWhatsappLink")}
            </a>
            <span>{t(lang, "pages.memberReport.shareNote")}</span>
          </p>
        )}
      </div>

      {isManager && (
        <div className="member-report-send-all glass-strong rounded-2xl border app-border p-3 md:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold app-text">
                {t(lang, "pages.memberReport.sendAllTitle")}
              </p>
              <p className="mt-0.5 text-xs app-text-faint">
                {t(lang, "pages.memberReport.sendAllDescription")}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void handleSendAll()}
              disabled={sendAllBusy || sendAllStats.ready === 0}
              className="shrink-0 rounded-xl"
            >
              {sendAllBusy ? (
                <span className="app-spinner" aria-hidden="true" />
              ) : (
                <Send className="size-4" />
              )}
              <span>
                {sendAllBusy
                  ? t(lang, "pages.memberReport.sendAllPreparing")
                  : t(lang, "pages.memberReport.sendAllSend")}
              </span>
            </Button>
          </div>

          <p className="mt-3 text-[11px] app-text-faint">
            {t(lang, "pages.memberReport.sendAllTotal")}: {sendAllStats.total}{" "}
            · {t(lang, "pages.memberReport.sendAllReady")}: {sendAllStats.ready}{" "}
            · {t(lang, "pages.memberReport.sendAllMissing")}: {sendAllStats.missing}{" "}
            · {t(lang, "pages.memberReport.sendAllOpened")}: {sendAllStats.opened}
          </p>

          {sendAllStats.total === 0 ? (
            <p className="mt-2 text-xs app-text-faint">
              {t(lang, "pages.memberReport.sendAllNoReady")}
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {sendAllEntries.map((entry) => (
                <li
                  key={entry.memberId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border app-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium app-text">
                      {entry.memberName}
                    </p>
                    <p className="text-[11px] app-text-faint">
                      {entry.status === "ready"
                        ? formatBangladeshMobile(entry.number ?? "")
                        : t(lang, "pages.memberReport.sendAllStatusMissing")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium app-text-faint">
                      {sendAllStatusLabel(entry.status)}
                    </span>
                    {entry.status === "ready" ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        disabled={sendAllBusy}
                        onClick={() => void handleSendOne(entry.memberId)}
                        className="rounded-lg"
                      >
                        {t(lang, "pages.memberReport.sendAllSend")}
                      </Button>
                    ) : (
                      <span className="text-[11px] app-text-faint">
                        {t(lang, "pages.memberReport.sendAllStatusMissing")}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {members.length === 0 || !data ? (
        <p className="rounded-xl border app-border app-surface px-4 py-3 text-sm app-text-faint">
          {members.length === 0
            ? t(lang, "pages.memberReport.noMembers")
            : t(lang, "pages.memberReport.noMemberData")}
        </p>
      ) : (
        <MemberReportSheet data={data} lang={lang} sheetRef={sheetRef} />
      )}
    </div>
  );
}

function MemberReportSheet({
  data,
  lang,
  sheetRef,
}: {
  data: MemberReportData;
  lang: Lang;
  sheetRef: RefObject<HTMLDivElement | null>;
}) {
  const {
    memberName,
    memberType,
    month,
    meals,
    averageRate,
    mealCost,
    advance,
    due,
    eggPieces,
    eggCost,
    guestMeals,
    guestCost,
    loanSummary,
  } = data;

  const money = (value: number) => formatAmount(value, lang);
  const dueTone: StatTone =
    due > 0 ? "danger" : due < 0 ? "emerald" : "faint";

  const stats = [
    {
      label: t(lang, "pages.memberReport.totalMeals"),
      value: meals > 0 ? String(meals) : "—",
      tone: "emerald" as StatTone,
      icon: <UtensilsCrossed />,
    },
    {
      label: t(lang, "pages.memberReport.averageRate"),
      value: averageRate !== null ? money(averageRate) : "—",
      tone: "orange" as StatTone,
      icon: <Scale />,
    },
    {
      label: t(lang, "pages.monthly.mealCost"),
      value: mealCost > 0 ? money(mealCost) : "—",
      tone: "emerald" as StatTone,
      icon: <Receipt />,
    },
    {
      label: t(lang, "pages.monthly.advance"),
      value: advance > 0 ? money(advance) : "—",
      tone: "emerald" as StatTone,
      icon: <Wallet />,
    },
    {
      label: t(lang, "pages.monthly.due"),
      value: money(due),
      tone: dueTone,
      icon: <TrendingUp />,
    },
  ];

  const detailRows = [
    { label: t(lang, "pages.monthly.memberType"), value: badgeLabel(lang, memberType) },
    { label: t(lang, "pages.memberReport.eggPieces"), value: eggPieces > 0 ? String(eggPieces) : "—" },
    { label: t(lang, "pages.monthly.eggCost"), value: zeroOrAmount(eggCost, lang) },
    { label: t(lang, "pages.memberReport.guestMeals"), value: guestMeals > 0 ? String(guestMeals) : "—" },
    { label: t(lang, "pages.monthly.guestCost"), value: zeroOrAmount(guestCost, lang) },
  ];

  const loanRows = loanSummary
    ? [
        {
          label: t(lang, "pages.memberReport.totalLoaned"),
          value: money(loanSummary.totalLoaned),
        },
        {
          label: t(lang, "pages.officeLoans.totalRepaid"),
          value: money(loanSummary.totalRepaid),
        },
        {
          label: t(lang, "pages.officeLoans.remainingBalance"),
          value: money(loanSummary.remainingBalance),
        },
        {
          label: t(lang, "pages.memberReport.loanCount"),
          value: String(loanSummary.loanCount),
        },
      ]
    : [];

  return (
    <>
      <style>{REPORT_SHEET_CSS}</style>
      <div ref={sheetRef} className="mr-sheet">
        <div className="mr-header">
          <div className="mr-header-brand">
            <div className="mr-header-mark">
              <img src="/logo.png" alt="Mess Manager" />
            </div>
            <span className="mr-header-brand-name">Mess Manager</span>
          </div>
          <p className="mr-header-kicker">{t(lang, "pages.memberReport.title")}</p>
          <h1 className="mr-header-title">{memberName}</h1>
          <p className="mr-header-subtitle">{month}</p>
          <span className="mr-header-role">{badgeLabel(lang, memberType)}</span>
        </div>

        <div className="mr-body">
          <div className="mr-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="mr-stat">
                <div
                  className="mr-stat-icon"
                  style={{ backgroundColor: TONE_TINTS[stat.tone] }}
                >
                  <span style={{ color: TONE_COLORS[stat.tone] }}>
                    {stat.icon}
                  </span>
                </div>
                <div className="mr-stat-value">{stat.value}</div>
                <div className="mr-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mr-sections">
            <section className="mr-section">
              <h3 className="mr-section-title">
                {t(lang, "pages.memberReport.details")}
              </h3>
              {detailRows.map((row) => (
                <div key={row.label} className="mr-row">
                  <span className="mr-row-label">{row.label}</span>
                  <span className="mr-row-value">{row.value}</span>
                </div>
              ))}
            </section>

            {loanRows.length > 0 && (
              <section className="mr-section">
                <h3 className="mr-section-title">
                  {t(lang, "pages.memberReport.officeLoan")}
                </h3>
                {loanRows.map((row) => (
                  <div key={row.label} className="mr-row">
                    <span className="mr-row-label">{row.label}</span>
                    <span className="mr-row-value">{row.value}</span>
                  </div>
                ))}
              </section>
            )}
          </div>

          <div className="mr-footer">
            <span>Mess Manager</span>
            <span>{month}</span>
          </div>
        </div>
      </div>
    </>
  );
}
