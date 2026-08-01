"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Fuel, TrendingUp, TrendingDown, Calendar, Droplets, AlertCircle } from "lucide-react"

export interface ConsumptionData {
  month: string
  liters: number
}

/* ─── helpers ─────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return `${n}`
}
function fmtFull(n: number) {
  return n.toLocaleString()
}

/* ─── Custom tooltip ─────────────────────────────── */
interface TooltipPayloadItem {
  name: string
  value: number
  color?: string
}
interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1f2e] p-3 shadow-2xl text-sm">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? "#22c55e" }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-medium text-white">
            {p.name === "vs Previous Month (%)"
              ? `${p.value > 0 ? "+" : ""}${Number(p.value).toFixed(1)}%`
              : `${fmtFull(p.value)} L`}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Custom bar label ───────────────────────────── */
interface CustomLabelProps {
  x?: number
  y?: number
  width?: number
  value?: number
}

function CustomBarLabel({ x = 0, y = 0, width = 0, value = 0 }: CustomLabelProps) {
  if (!value) return null
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="#e2e8f0"
      textAnchor="middle"
      fontSize={11}
      fontWeight={500}
    >
      {fmtFull(value)} L
    </text>
  )
}

/* ─── StatCard ───────────────────────────────────── */
interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sub: string
  trend?: React.ReactNode
}
function StatCard({ icon, iconBg, label, value, sub, trend }: StatCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 flex-1 min-w-0"
      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)" }}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 truncate">{label}</p>
        <p className="text-xl font-bold text-white leading-tight">{value}</p>
        <p className="text-xs text-gray-500 truncate">{sub}</p>
      </div>
      {trend && <div className="shrink-0">{trend}</div>}
    </div>
  )
}

/* ─── Insight pill ───────────────────────────────── */
interface InsightProps {
  icon: React.ReactNode
  iconBg: string
  text: React.ReactNode
}
function Insight({ icon, iconBg, text }: InsightProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-300">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <span>{text}</span>
    </div>
  )
}

/* ─── Main chart component ───────────────────────── */
export function ConsumptionChart({ data }: { data: ConsumptionData[] }) {
  const [selectedYear] = useState(new Date().getFullYear())

  const enriched = useMemo(() => {
    return data.map((d, i) => {
      const prev = i > 0 ? data[i - 1].liters : null
      const pct = prev && prev > 0 ? ((d.liters - prev) / prev) * 100 : null
      return { ...d, pct }
    })
  }, [data])

  const nonZero = data.filter((d) => d.liters > 0)
  const total = nonZero.reduce((s, d) => s + d.liters, 0)
  const avg = nonZero.length > 0 ? total / nonZero.length : 0
  const maxEntry = nonZero.reduce(
    (m, d) => (d.liters > m.liters ? d : m),
    nonZero[0] ?? { month: "-", liters: 0 }
  )
  const minEntry = nonZero.reduce(
    (m, d) => (d.liters < m.liters ? d : m),
    nonZero[0] ?? { month: "-", liters: 0 }
  )

  const lastTwo = nonZero.slice(-2)
  const lastPct =
    lastTwo.length === 2 && lastTwo[0].liters > 0
      ? ((lastTwo[1].liters - lastTwo[0].liters) / lastTwo[0].liters) * 100
      : null

  const lastMonth = enriched[enriched.length - 1]

  function barColor(entry: ConsumptionData) {
    if (entry.liters === 0) return "transparent"
    if (minEntry && entry.liters === minEntry.liters && entry.month === minEntry.month)
      return "url(#colorAmber)"
    return "url(#colorGreen)"
  }

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: "linear-gradient(160deg, #0d1117 0%, #0a0f1a 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20">
            <Fuel className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">Fuel Consumption Trend</h3>
            <p className="text-xs text-gray-400">Monthly fuel delivery volume (L)</p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-gray-300 cursor-default select-none"
          style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}
        >
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span>{selectedYear}</span>
          <svg
            className="h-3 w-3 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex gap-3 px-6 py-3 flex-wrap">
        <StatCard
          icon={<Droplets className="h-5 w-5 text-emerald-400" />}
          iconBg="bg-emerald-500/15"
          label={`Total (${nonZero.length > 0 ? `${enriched[0]?.month ?? ""} – ${enriched[nonZero.length - 1]?.month ?? ""}` : "–"})`}
          value={`${fmtFull(total)} L`}
          sub={
            lastPct !== null
              ? `${lastPct > 0 ? "▲" : "▼"} ${Math.abs(lastPct).toFixed(1)}% vs prev month`
              : "No prior month data"
          }
          trend={
            lastPct !== null ? (
              <span
                className={`text-xs font-semibold ${lastPct >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {lastPct > 0 ? "▲" : "▼"} {Math.abs(lastPct).toFixed(1)}%
              </span>
            ) : undefined
          }
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
          iconBg="bg-blue-500/15"
          label="Average / Month"
          value={`${fmtFull(Math.round(avg))} L`}
          sub={`Across ${nonZero.length} month${nonZero.length !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={<div className="h-5 w-5 rounded-full border-2 border-purple-400 bg-transparent" />}
          iconBg="bg-purple-500/15"
          label="Highest Month"
          value={`${fmtFull(maxEntry?.liters ?? 0)} L`}
          sub={maxEntry?.month ?? "-"}
        />
        <StatCard
          icon={<Fuel className="h-5 w-5 text-amber-400" />}
          iconBg="bg-amber-500/15"
          label="Lowest Month"
          value={`${fmtFull(minEntry?.liters ?? 0)} L`}
          sub={minEntry?.month ?? "-"}
        />
      </div>

      {/* Chart */}
      <div className="px-2 pt-2 pb-0" style={{ height: 310 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={enriched}
            margin={{ top: 28, right: 50, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={1} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="colorAmber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.85} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="0"
            />

            <ReferenceLine
              yAxisId="right"
              y={0}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              dy={8}
            />

            <YAxis
              yAxisId="left"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(v) => `${fmt(v)} L`}
              width={52}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#22c55e", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              domain={[-20, 20]}
              width={42}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />

            <Bar
              yAxisId="left"
              dataKey="liters"
              name="Fuel Volume (L)"
              radius={[5, 5, 0, 0]}
              maxBarSize={52}
              label={<CustomBarLabel />}
            >
              {enriched.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={barColor(entry)} />
              ))}
            </Bar>

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pct"
              name="vs Previous Month (%)"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: "#0d1117", stroke: "#22c55e", strokeWidth: 2, r: 4 }}
              activeDot={{ fill: "#22c55e", r: 6 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pb-3 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: "linear-gradient(to bottom, #4ade80, #16a34a)" }}
          />
          Fuel Volume (L)
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="relative inline-flex items-center">
            <span className="inline-block h-0.5 w-5 bg-emerald-500" />
            <span
              className="absolute left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full border-2 border-emerald-500"
              style={{ background: "#0d1117" }}
            />
          </span>
          vs Previous Month (%)
        </div>
      </div>

      {/* Insights bar */}
      <div
        className="flex flex-wrap items-center gap-4 px-6 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
            <Fuel className="h-4 w-4" />
          </div>
          Insights
        </div>

        {lastPct !== null && (
          <Insight
            icon={
              lastPct >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-white" />
              )
            }
            iconBg={lastPct >= 0 ? "bg-emerald-500" : "bg-red-500"}
            text={
              <>
                <span className="font-semibold text-white">{lastMonth?.month}</span> shows a{" "}
                <span
                  className={`font-semibold ${lastPct >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {Math.abs(lastPct).toFixed(1)}% {lastPct >= 0 ? "increase" : "decrease"}
                </span>{" "}
                vs prev month
              </>
            }
          />
        )}

        {minEntry && (
          <Insight
            icon={<div className="h-3.5 w-3.5 rounded bg-purple-400" />}
            iconBg="bg-purple-600"
            text={
              <>
                Consumption dropped in{" "}
                <span className="font-semibold text-white">{minEntry.month}</span> — lowest recorded
              </>
            }
          />
        )}

        <Insight
          icon={<Droplets className="h-3.5 w-3.5 text-white" />}
          iconBg="bg-blue-500"
          text={
            <>
              Avg. monthly consumption is{" "}
              <span className="font-semibold text-white">{fmtFull(Math.round(avg))} L</span>
            </>
          }
        />

        <Insight
          icon={<AlertCircle className="h-3.5 w-3.5 text-white" />}
          iconBg="bg-amber-500"
          text={
            <>
              Monitor next month&apos;s trend for{" "}
              <span className="font-semibold text-white">early anomaly detection</span>
            </>
          }
        />
      </div>
    </div>
  )
}
