"use client";

import { useTheme } from "next-themes";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Lang, t } from "@/lib/lang";

interface MealData {
  name: string;
  meals: number;
}

interface MealChartProps {
  data: MealData[];
  lang?: Lang;
}

const EMERALD_SHADES = [
  "#059669",
  "#10b981",
  "#34d399",
  "#6ee7b7",
  "#a7f3d0",
  "#d1fae5",
  "#047857",
  "#065f46",
];

const ORANGE_ACCENT = "#f97316";

export function MealChart({ data, lang = "bn" }: MealChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (data.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center px-4 text-center">
        <div>
          <p className="font-medium app-text">{t(lang, "common.noDataYet")}</p>
          <p className="mt-1 text-sm app-text-faint">
            {t(lang, "common.mealEntriesWillAppear")}
          </p>
        </div>
      </div>
    );
  }

  const totalMeals = data.reduce((sum, d) => sum + d.meals, 0);
  const maxIndex = data.reduce(
    (maxIdx, d, i) => (d.meals > (data[maxIdx]?.meals ?? 0) ? i : maxIdx),
    0
  );
  const legendColor = isDark ? "rgba(255,255,255,0.78)" : "#2f4f45";
  const tooltipStyle = {
    backgroundColor: isDark ? "rgba(6, 46, 38, 0.92)" : "rgba(255, 255, 255, 0.96)",
    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(15, 60, 45, 0.15)"}`,
    borderRadius: "10px",
    backdropFilter: "blur(12px)",
    color: isDark ? "#ffffff" : "#123a2f",
    fontSize: "12px",
  } as const;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius="42%"
            outerRadius="62%"
            fill="#8884d8"
            paddingAngle={2}
            dataKey="meals"
            nameKey="name"
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  index === maxIndex
                    ? ORANGE_ACCENT
                    : EMERALD_SHADES[index % EMERALD_SHADES.length]
                }
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              color: legendColor,
              fontSize: 11,
              lineHeight: "16px",
              paddingTop: 6,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center text-sm app-text-muted">
        {t(lang, "summary.totalMeal")}:{" "}
        <span className="font-semibold app-text">{totalMeals}</span>
      </p>
    </div>
  );
}
