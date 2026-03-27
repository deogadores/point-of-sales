"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createSaleAction } from "@/app/(pos)/actions";
import { formatMoney } from "@/lib/format";
import { DateTimePicker } from "@/app/(pos)/sales/new/DateTimePicker";

function ProductCombobox({
  products,
  value,
  onChange,
}: {
  products: Product[];
  value: number;
  onChange: (id: number) => void;
}) {
  const selected = products.find((p) => p.id === value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : products;

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  function handleBlur(e: React.FocusEvent) {
    // Let the click on a list item fire first
    setTimeout(() => {
      if (!inputRef.current?.matches(":focus")) {
        setOpen(false);
        setQuery("");
      }
    }, 100);
  }

  function select(id: number) {
    onChange(id);
    setQuery("");
    setOpen(false);
  }

  const dropdown =
    open && filtered.length > 0 ? (
      <ul
        style={dropdownStyle}
        className="max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900"
      >
        {filtered.map((p) => (
          <li
            key={p.id}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => select(p.id)}
            className={`cursor-pointer px-3 py-2 hover:bg-indigo-50 dark:hover:bg-gray-700 ${
              p.id === value ? "bg-indigo-50 font-medium dark:bg-gray-700" : ""
            }`}
          >
            {p.name}
            <span className="ml-2 text-xs text-slate-400">
              stock {Number(p.stock_qty).toFixed(2)} {p.unit_symbol ?? ""}
            </span>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <>
      <input
        ref={inputRef}
        className="field"
        value={open ? query : (selected?.name ?? "")}
        placeholder="Search product…"
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </>
  );
}

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


export function SaleForm({ products, currency }: { products: Product[]; currency: string }) {
  const firstId = products[0]?.id ?? 0;
  const [lines, setLines] = useState<Line[]>([]);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState("");

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

      {useCustomDate && (
        <input type="hidden" name="soldAt" value={customDate} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs font-medium text-slate-600">Transaction date</div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium dark:border-gray-700">
          <button
            type="button"
            onClick={() => setUseCustomDate(false)}
            className={`px-3 py-1.5 transition ${!useCustomDate ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700"}`}
          >
            Now
          </button>
          <button
            type="button"
            onClick={() => setUseCustomDate(true)}
            className={`px-3 py-1.5 transition border-l border-slate-200 dark:border-gray-700 ${useCustomDate ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700"}`}
          >
            Custom
          </button>
        </div>
        {useCustomDate && (
          <DateTimePicker value={customDate} onChange={setCustomDate} />
        )}
      </div>

      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {lines.length === 0 ? (
          <div className="py-2 text-sm text-slate-600">Add a line item.</div>
        ) : (
          lines.map((l, idx) => {
            const p = productById.get(l.productId);
            const unitSale = Number(p?.unit_sale_price ?? 0);
            const unitCost = Number(p?.unit_cost_price ?? 0);
            const lineRevenue = unitSale * l.quantity;
            const lineProfit = (unitSale - unitCost) * l.quantity;
            return (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                <div className="space-y-2">
                  <label>
                    <div className="text-xs font-medium text-slate-600">Product</div>
                    <div className="mt-1">
                      <ProductCombobox
                        products={products}
                        value={l.productId}
                        onChange={(nextId) =>
                          setLines((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, productId: nextId } : x))
                          )
                        }
                      />
                    </div>
                  </label>
                  <label>
                    <div className="text-xs font-medium text-slate-600">Quantity</div>
                    <input
                      className="field mt-1"
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
                  </label>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div>Unit sale: {formatMoney(unitSale, currency)}</div>
                    <div>Unit cost: {formatMoney(unitCost, currency)}</div>
                    <div>Line revenue: {formatMoney(lineRevenue, currency)}</div>
                    <div>Line profit: {formatMoney(lineProfit, currency)}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost w-full"
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Desktop table layout */}
      <div className="hidden w-full overflow-x-auto no-scrollbar md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="whitespace-nowrap py-2 pr-3">Product</th>
              <th className="whitespace-nowrap py-2 pr-3">Qty</th>
              <th className="whitespace-nowrap py-2 pr-3">Unit sale</th>
              <th className="whitespace-nowrap py-2 pr-3">Unit cost</th>
              <th className="whitespace-nowrap py-2 pr-3">Line revenue</th>
              <th className="whitespace-nowrap py-2 pr-3">Line profit</th>
              <th className="whitespace-nowrap py-2 pr-3">Actions</th>
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
                      <ProductCombobox
                        products={products}
                        value={l.productId}
                        onChange={(nextId) =>
                          setLines((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, productId: nextId } : x))
                          )
                        }
                      />
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
                    <td className="py-2 pr-3">{formatMoney(unitSale, currency)}</td>
                    <td className="py-2 pr-3">{formatMoney(unitCost, currency)}</td>
                    <td className="py-2 pr-3">{formatMoney(lineRevenue, currency)}</td>
                    <td className="py-2 pr-3">{formatMoney(lineProfit, currency)}</td>
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
            <div className="font-semibold">{formatMoney(totals.revenue, currency)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total profit</div>
            <div className="font-semibold">{formatMoney(totals.profit, currency)}</div>
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

