"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatNumber, formatShortDate } from "@/lib/format";
import type { MovementSeriesPoint } from "@/lib/data/dashboard";

export function MovementChart({ data }: { data: MovementSeriesPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#e9eef4" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickFormatter={(value: string) => formatShortDate(`${value}T00:00:00.000Z`)}
            minTickGap={18}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 24px -12px rgba(15, 23, 42, 0.25)",
              fontSize: 12,
            }}
            labelFormatter={(label) => formatShortDate(`${String(label)}T00:00:00.000Z`)}
            formatter={(value, name) => [
              formatNumber(Number(value)),
              name === "stock_in" ? "Stock in" : "Stock out",
            ]}
          />
          <Bar
            dataKey="stock_in"
            name="stock_in"
            fill="#059669"
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
          />
          <Bar
            dataKey="stock_out"
            name="stock_out"
            fill="#cbd5e1"
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
