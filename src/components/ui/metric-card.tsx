"use client";

import React, { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
  bg?: string;
  valueSuffix?: string;
  delta?: number;
  sparklineData?: Record<string, unknown>[];
  sparklineKey?: string;
}

function useCountUp(end: number | string, duration: number = 1500) {
  const [count, setCount] = useState<number | string>(typeof end === "number" ? 0 : end);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (typeof end === "string") {
      setCount(end);
      return;
    }

    startTime.current = null;
    setCount(0);

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * (end as number)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end as number);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration]);

  return count;
}

export function MetricCard({
  title,
  value,
  sub,
  icon,
  color = "text-slate-600",
  bg = "bg-slate-50",
  valueSuffix = "",
  delta,
  sparklineData,
  sparklineKey = "value",
}: MetricCardProps) {
  const animatedValue = useCountUp(value, 1500);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.12)]">
      {/* Decorative background glow */}
      <div
        className={cn(
          "absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-30 blur-2xl transition-all duration-500 group-hover:scale-[2] group-hover:opacity-50",
          bg
        )}
      />

      <div className="relative z-10 flex flex-row items-center justify-between pb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
          {title}
        </h3>
        <div
          className={cn(
            "rounded-xl p-3 ring-4 ring-white shadow-sm transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110",
            bg
          )}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<{ className?: string; strokeWidth?: number }>, {
                className: cn("h-5 w-5", color),
                strokeWidth: 2.5,
              })
            : icon}
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-black tracking-tight text-gray-900">
              {typeof animatedValue === "number"
                ? animatedValue.toLocaleString()
                : animatedValue}
              {valueSuffix}
            </div>
            {sub && (
              <p className="mt-2 text-xs font-medium text-gray-500 line-clamp-1">
                {sub}
              </p>
            )}
          </div>

          {/* Delta Badge */}
          {typeof delta === "number" && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold tracking-tight shadow-sm transition-transform duration-300 group-hover:scale-105",
                delta > 0
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20"
                  : delta < 0
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-500/20"
                  : "bg-slate-50 text-slate-700 ring-1 ring-slate-500/20"
              )}
            >
              {delta > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : delta < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>{Math.abs(delta)}%</span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-12 w-full opacity-60 transition-opacity duration-300 group-hover:opacity-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey={sparklineKey}
                  stroke={delta && delta < 0 ? "#f43f5e" : "#10b981"}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
