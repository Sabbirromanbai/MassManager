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

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#eab308",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export function MealChart({ data }: MealChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="text-center text-muted-foreground">
          <p className="font-medium">No data yet</p>
          <p className="text-sm">Meal entries will appear here</p>
        </div>
      </div>
    );
  }

  const totalMeals = data.reduce((sum, d) => sum + d.meals, 0);

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
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
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
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Total meals: <span className="font-medium">{totalMeals}</span>
      </div>
    </div>
  );
}