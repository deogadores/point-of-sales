"use client";

import { useMemo, useState } from "react";
import { createSaleAction } from "@/app/(pos)/actions";
import { formatMoney } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  unit_cost_price: number;
  unit_sale_price: number;
  unit_symbol: string | null;
  stock_qty: number;
};

type Line = {
  productId: number;
  quantity: number;
};

export function SaleForm({ products }: { products: Product[] }) {
  const firstId = products[0]?.id ?? 0;
  const [lines, setLines] = useState<Line[]>(
    firstId ? [{ productId: firstId, quantity: 1 }] : []
  );

  const productById = useMemo(() => {
    return new Map<number, Product>(products.map((p) => [p.id, p]));
  }, [products]);

  const totals = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    for (const l of lines) {
      const p = productById.get(l.productId);
      if (!p) continue;
      const lineRevenue = Number(p.unit_sale_price) * l.quantity;
      const lineProfit = (Number(p.unit_sale_price) - Number(p.unit_cost_price)) * l.quantity;
      revenue += lineRevenue;
      profit += lineProfit;
    }
    return { revenue, profit };
  }, [lines, productById]);

  const itemsJson = JSON.stringify(
    lines
      .filter((l) => Number.isFinite(l.quantity) && l.quantity > 0)
      .map((l) => ({ productId: l.productId, quantity: l.quantity }))
  );

  return (
    <form action={createSaleAction} className="space-y-3">
      <input type="hidden" name="itemsJson" value={itemsJson} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Qty</th>
              <th className="py-2 pr-3">Unit sale</th>
              <th className="py-2 pr-3">Unit cost</th>
              <th className="py-2 pr-3">Line revenue</th>
              <th className="py-2 pr-3">Line profit</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-2 text-slate-600">
                  Add a line item.
                </td>
              </tr>
            ) : (
              lines.map((l, idx) => {
                const p = productById.get(l.productId);
                const unitSale = Number(p?.unit_sale_price ?? 0);
                const unitCost = Number(p?.unit_cost_price ?? 0);
                const lineRevenue = unitSale * l.quantity;
                const lineProfit = (unitSale - unitCost) * l.quantity;
                return (
                  <tr key={idx} className="border-t">
                    <td className="py-2 pr-3">
                      <select
                        className="field"
                        value={l.productId}
                        onChange={(e) => {
                          const nextId = Number(e.target.value);
                          setLines((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, productId: nextId } : x))
                          );
                        }}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} • stock {Number(p.stock_qty).toFixed(2)}{" "}
                            {p.unit_symbol ?? ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="field"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={l.quantity}
                        onChange={(e) => {
                          const q = Number(e.target.value);
                          setLines((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, quantity: q } : x))
                          );
                        }}
                      />
                    </td>
                    <td className="py-2 pr-3">{formatMoney(unitSale)}</td>
                    <td className="py-2 pr-3">{formatMoney(unitCost)}</td>
                    <td className="py-2 pr-3">{formatMoney(lineRevenue)}</td>
                    <td className="py-2 pr-3">{formatMoney(lineProfit)}</td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        className="btn btn-ghost px-3 py-1.5 text-xs"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (!firstId) return;
            setLines((prev) => [...prev, { productId: firstId, quantity: 1 }]);
          }}
          disabled={!firstId}
        >
          Add line
        </button>

        <div className="flex flex-wrap gap-3 text-sm">
          <div>
            <div className="text-xs font-medium text-slate-500">Total revenue</div>
            <div className="font-semibold">{formatMoney(totals.revenue)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total profit</div>
            <div className="font-semibold">{formatMoney(totals.profit)}</div>
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary w-full sm:w-auto"
        disabled={lines.length === 0}
      >
        Save sale
      </button>
    </form>
  );
}

