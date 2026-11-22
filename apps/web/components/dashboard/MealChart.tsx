"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "cn";

interface MealData {
  name: string;
  meals: number;
}

interface MealChartProps {
  data: MealData[];
}

const GREEN_SHADES = [
  "#16a34a",
  "#22c55e",
  "#4ade80",
  "#86efac",
  "#bbf7d0",
  "#dcfce7",
  "#f0fdf4",
  "#14532d",
];

const RED_ACCENT = "#dc2626";

export function MealChart({ data }: MealChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="text-center text-white/70">
          <p className="font-medium">No data yet</p>
          <p className="text-sm">Meal entries will appear here</p>
        </div>
      </div>
    );
  }

  const totalMeals = data.reduce((sum, d) => sum + d.meals, 0);
  const maxIndex = data.reduce((maxIdx, d, i) => (d.meals > (data[maxIdx]?.meals ?? 0) ? i : maxIdx), 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="meals"
            nameKey="name"
            label={({ name, percent }) => {
              const p = percent ?? 0;
              return `${name} ${(p * 100).toFixed(0)}%`;
            }}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === maxIndex ? RED_ACCENT : GREEN_SHADES[index % GREEN_SHADES.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              backdropFilter: "blur(12px)",
              color: "white",
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            wrapperStyle={{ paddingRight: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center text-sm text-white/70">
        Total meals: <span className="font-medium text-white">{totalMeals}</span>
      </div>
    </div>
  );
}