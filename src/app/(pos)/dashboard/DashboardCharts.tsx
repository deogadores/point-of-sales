"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type DayRow = { date: string; revenue: number; profit: number };
type MonthRow = { month: string; revenue: number; profit: number };
type ProductRow = { name: string; profit: number; revenue: number; qty_sold: number };

function money(v: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

function shortDate(d: string) {
  const [, m, day] = d.split("-");
  return `${m}/${day}`;
}

function shortMonth(m: string) {
  const [year, mo] = m.split("-");
  return new Date(Number(year), Number(mo) - 1).toLocaleString("default", { month: "short", year: "2-digit" });
}

function tooltipStyle(currency: string) {
  return {
    contentStyle: { borderRadius: "0.75rem", border: "1px solid #e2e8f0", fontSize: 12 },
    formatter: (value: number) => money(value, currency),
  };
}

export function DailyChart({ data, period, onPeriodChange, currency }: {
  data: DayRow[];
  period: 7 | 30;
  onPeriodChange: (p: 7 | 30) => void;
  currency: string;
}) {
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm font-semibold">Revenue &amp; Profit — Daily</div>
        <div className="flex gap-1">
          {([7, 30] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                period === p ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">No sales data yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v) => money(v, currency)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
            <Tooltip {...tooltipStyle(currency)} labelFormatter={(l) => `Date: ${l}`} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gradRevenue)" name="Revenue" />
            <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#gradProfit)" name="Profit" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function MonthlyChart({ data, currency }: { data: MonthRow[]; currency: string }) {
  return (
    <div className="card space-y-3">
      <div className="text-sm font-semibold">Revenue &amp; Profit — Monthly</div>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">No sales data yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tickFormatter={shortMonth} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v) => money(v, currency)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
            <Tooltip {...tooltipStyle(currency)} labelFormatter={(l) => `Month: ${shortMonth(l)}`} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function TopProductsChart({ data, currency }: { data: ProductRow[]; currency: string }) {
  return (
    <div className="card space-y-3">
      <div className="text-sm font-semibold">Top products by profit</div>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">No sales data yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => money(v, currency)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
            <Tooltip {...tooltipStyle(currency)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[0, 4, 4, 0]} />
            <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
