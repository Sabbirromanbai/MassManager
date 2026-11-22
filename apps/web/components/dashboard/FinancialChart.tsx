"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "cn";

interface DailyBazarData {
  date: number;
  amount: number;
}

interface FinancialChartProps {
  data: DailyBazarData[];
}

export function FinancialChart({ data }: FinancialChartProps) {
  const hasData = data.some((d) => d.amount > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="text-center">
          <p className="font-medium text-white/80">No data yet</p>
          <p className="mt-1 text-sm text-white/50">
            Bazar entries will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.15)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255, 255, 255, 0.7)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.15)" }}
            tickLine={{ stroke: "rgba(255, 255, 255, 0.15)" }}
            tickFormatter={(value) => String(value)}
            interval={Math.max(1, Math.floor(data.length / 10))}
          />
          <YAxis
            tick={{ fill: "rgba(255, 255, 255, 0.7)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `৳${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              backdropFilter: "blur(12px)",
              color: "white",
            }}
            labelFormatter={(date) => `Day ${date}`}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#f97316" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}