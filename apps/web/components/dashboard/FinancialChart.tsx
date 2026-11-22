"use client";

import { useTheme } from "next-themes";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Lang, t } from "@/lib/lang";

interface DailyBazarData {
  date: number;
  amount: number;
}

interface FinancialChartProps {
  data: DailyBazarData[];
  lang?: Lang;
}

export function FinancialChart({ data, lang = "bn" }: FinancialChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const hasData = data.some((d) => d.amount > 0);

  const gridStroke = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 60, 45, 0.12)";
  const tickColor = isDark ? "rgba(255, 255, 255, 0.7)" : "#3f5f54";
  const tooltipStyle = {
    backgroundColor: isDark ? "rgba(6, 46, 38, 0.92)" : "rgba(255, 255, 255, 0.96)",
    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(15, 60, 45, 0.15)"}`,
    borderRadius: "10px",
    backdropFilter: "blur(12px)",
    color: isDark ? "#ffffff" : "#123a2f",
    fontSize: "12px",
  } as const;

  if (!hasData) {
    return (
      <div className="flex h-64 w-full items-center justify-center px-4 text-center">
        <div>
          <p className="font-medium app-text">{t(lang, "common.noDataYet")}</p>
          <p className="mt-1 text-sm app-text-faint">
            {t(lang, "common.bazarEntriesWillAppear")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey="date"
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={{ stroke: gridStroke }}
            tickLine={{ stroke: gridStroke }}
            tickFormatter={(value) => String(value)}
            interval={Math.max(1, Math.floor(data.length / 8))}
            minTickGap={4}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(value) => `৳${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(date) => `#${date}`}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, fill: "#f97316" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
