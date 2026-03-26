"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateTimePicker } from "@/app/(pos)/sales/new/DateTimePicker";

type Product = { id: number | string; name: string };

export function SalesFilterForm({
  products,
  startDate,
  endDate,
  productIdStr,
}: {
  products: Product[];
  startDate: string;
  endDate: string;
  productIdStr: string;
}) {
  const router = useRouter();
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [productId, setProductId] = useState(productIdStr);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    if (productId) params.set("productId", productId);
    router.push(`/sales?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-6">
      <div className="sm:col-span-2">
        <div className="text-xs font-medium text-slate-600 mb-1">Start date</div>
        <DateTimePicker showTime={false} value={start} onChange={setStart} />
      </div>

      <div className="sm:col-span-2">
        <div className="text-xs font-medium text-slate-600 mb-1">End date</div>
        <DateTimePicker showTime={false} value={end} onChange={setEnd} />
      </div>

      <label className="sm:col-span-2">
        <div className="text-xs font-medium text-slate-600">Product (optional)</div>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="field mt-1"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-6">
        <button type="submit" className="btn btn-primary w-full sm:w-auto">
          Run query
        </button>
      </div>
    </form>
  );
}
