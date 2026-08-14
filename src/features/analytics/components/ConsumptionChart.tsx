"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface ConsumptionChartProps {
  data: { month: string; liters: number }[]
}

export function ConsumptionChart({ data }: ConsumptionChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}L`}
          />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
            formatter={(value: number) => [`${value.toFixed(0)} L`, "Fuel Delivered"]}
          />
          <Bar dataKey="liters" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Fuel Delivered" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
