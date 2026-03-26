"use client";

import { useState } from "react";
import { DailyChart, MonthlyChart, TopProductsChart } from "./DashboardCharts";

type DayRow = { date: string; revenue: number; profit: number };
type MonthRow = { month: string; revenue: number; profit: number };
type ProductRow = { name: string; profit: number; revenue: number; qty_sold: number };

export function DashboardChartsWrapper({
  daily7,
  daily30,
  monthly,
  topProducts,
  currency,
}: {
  daily7: DayRow[];
  daily30: DayRow[];
  monthly: MonthRow[];
  topProducts: ProductRow[];
  currency: string;
}) {
  const [period, setPeriod] = useState<7 | 30>(30);

  return (
    <div className="space-y-4">
      <DailyChart data={period === 7 ? daily7 : daily30} period={period} onPeriodChange={setPeriod} currency={currency} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlyChart data={monthly} currency={currency} />
        <TopProductsChart data={topProducts} currency={currency} />
      </div>
    </div>
  );
}
