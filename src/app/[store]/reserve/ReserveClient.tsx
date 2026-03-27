"use client";

import { useMemo, useState } from "react";
import { createReservationAction } from "@/app/[store]/reserve/actions";
import { formatMoney } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  image_url: string | null;
  unit_sale_price: number;
  unit_symbol: string | null;
  stock_qty: number;
};

type CartItem = { productId: number; quantity: number };

export function ReserveClient({
  storeSlug,
  products,
  currency,
}: {
  storeSlug: string;
  products: Product[];
  currency: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"browse" | "checkout">("browse");
  const [search, setSearch] = useState("");
  const [hideOutOfStock, setHideOutOfStock] = useState(false);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function addToCart(productId: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) return prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { productId, quantity: 1 }];
    });
  }

  function removeOne(productId: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing && existing.quantity > 1) return prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i));
      return prev.filter((i) => i.productId !== productId);
    });
  }

  function setQty(productId: number, qty: number) {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.productId !== productId));
    else setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
  }

  const total = useMemo(
    () => cart.reduce((acc, item) => acc + Number(productById.get(item.productId)?.unit_sale_price ?? 0) * item.quantity, 0),
    [cart, productById]
  );

  const totalQty = cart.reduce((a, i) => a + i.quantity, 0);
  const itemsJson = JSON.stringify(cart.map((i) => ({ productId: i.productId, quantity: i.quantity })));
  const filtered = useMemo(() => {
    let result = products;
    if (hideOutOfStock) result = result.filter((p) => Number(p.stock_qty) > 0);
    if (search.trim()) result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [products, search, hideOutOfStock]);

  if (step === "checkout") {
    return (
      <div className="space-y-4">
        <div className="card flex items-center gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setStep("browse")}>
            ← Back
          </button>
          <div>
            <div className="text-sm font-semibold">Checkout</div>
            <div className="text-xs text-slate-500">Review your cart and enter your contact details</div>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="text-sm font-semibold">Your cart</div>
          {cart.map((item) => {
            const p = productById.get(item.productId);
            if (!p) return null;
            return (
              <div key={item.productId} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <div>{p.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatMoney(p.unit_sale_price, currency)} × {item.quantity} {p.unit_symbol ?? ""}
                  </div>
                </div>
                <div className="font-medium whitespace-nowrap">{formatMoney(Number(p.unit_sale_price) * item.quantity, currency)}</div>
              </div>
            );
          })}
          <div className="border-t border-slate-200 pt-3 flex justify-between text-sm font-semibold dark:border-gray-700">
            <span>Total</span>
            <span>{formatMoney(total, currency)}</span>
          </div>
        </div>

        <div className="card">
          <form action={createReservationAction} className="space-y-4">
            <input type="hidden" name="storeSlug" value={storeSlug} />
            <input type="hidden" name="itemsJson" value={itemsJson} />
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Full name *</label>
              <input name="customerName" required className="field" placeholder="Your full name" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
              <input name="customerEmail" type="email" className="field" placeholder="your@email.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Phone *</label>
              <input name="customerPhone" type="tel" required className="field" placeholder="09XX XXX XXXX" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Notes</label>
              <textarea name="notes" className="field" rows={3} placeholder="Any special requests…" />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Place reservation
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={() => setHideOutOfStock((v) => !v)}
          className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition ${
            hideOutOfStock
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700"
          }`}
        >
          {hideOutOfStock ? "Showing in-stock only" : "Show in-stock only"}
        </button>
        {cart.length > 0 && (
          <button className="btn btn-primary shrink-0" onClick={() => setStep("checkout")}>
            Checkout ({totalQty}) · {formatMoney(total, currency)} →
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="card text-sm text-slate-600">No products are currently available.</div>
      ) : filtered.length === 0 ? (
        <div className="card text-sm text-slate-600">No products match your search.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const cartItem = cart.find((i) => i.productId === p.id);
            const qty = cartItem?.quantity ?? 0;
            const inStock = Number(p.stock_qty) > 0;
            return (
              <div key={p.id} className="card flex flex-col gap-3 p-0 overflow-hidden">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="flex flex-col gap-3 p-3 flex-1">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                      {inStock
                        ? `${Number(p.stock_qty).toFixed(0)} ${p.unit_symbol ?? ""} available`
                        : "Out of stock"}
                    </div>
                    <div className="mt-2 text-base font-semibold">{formatMoney(p.unit_sale_price, currency)}</div>
                  </div>

                  {inStock ? (
                    qty === 0 ? (
                      <button className="btn btn-primary w-full" onClick={() => addToCart(p.id)}>
                        Add to cart
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-ghost px-3" onClick={() => removeOne(p.id)}>−</button>
                        <input
                          type="number"
                          className="field text-center"
                          min="1"
                          value={qty}
                          onChange={(e) => setQty(p.id, Number(e.target.value))}
                        />
                        <button type="button" className="btn btn-ghost px-3" onClick={() => addToCart(p.id)}>+</button>
                      </div>
                    )
                  ) : (
                    <button disabled className="btn btn-ghost w-full opacity-50 cursor-not-allowed">
                      Out of stock
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
