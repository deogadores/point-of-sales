import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { requireAuth } from "@/lib/auth";
import { listProductsWithStock, listUnits } from "@/lib/pos";
import { ProductForm } from "./ProductForm";

export const runtime = "nodejs";

export default async function ProductsPage() {
  const user = await requireAuth();
  const [products, units] = await Promise.all([
    listProductsWithStock(user.storeId),
    listUnits(user.storeId)
  ]);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Products</div>
            <p className="mt-1 text-xs text-slate-500">
              Each product has a cost price and a sale price (profit = sale - cost).
            </p>
          </div>
          <Link className="btn btn-ghost" href="/reference/units">
            Maintain units
          </Link>
        </div>

        <ProductForm units={units} />
      </div>

      <div className="card">
        <div className="text-sm font-semibold">Product list</div>
        {/* Mobile card layout */}
        <div className="mt-3 space-y-2 md:hidden">
          {products.length === 0 ? (
            <div className="py-2 text-sm text-slate-600">No products yet.</div>
          ) : (
            products.map((p) => {
              const unitProfit = Number(p.unit_sale_price) - Number(p.unit_cost_price);
              return (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex gap-3">
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover border border-slate-200"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium">{p.name}</div>
                    <div className="mt-1 space-y-1 text-sm text-slate-600">
                      <div>Unit: {p.unit_name} {p.unit_symbol ? `(${p.unit_symbol})` : ""}</div>
                      <div>Cost: {formatMoney(Number(p.unit_cost_price), user.storeCurrency)}</div>
                      <div>Sale: {formatMoney(Number(p.unit_sale_price), user.storeCurrency)}</div>
                      <div>Profit: {formatMoney(unitProfit, user.storeCurrency)}</div>
                      <div>Stock: {Number(p.stock_qty).toFixed(2)} {p.unit_symbol ?? ""}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Desktop table layout */}
        <div className="mt-3 hidden w-full overflow-x-auto no-scrollbar md:block">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="whitespace-nowrap py-2 pr-3 w-10"></th>
                <th className="whitespace-nowrap py-2 pr-3">Name</th>
                <th className="whitespace-nowrap py-2 pr-3">Unit</th>
                <th className="whitespace-nowrap py-2 pr-3">Cost</th>
                <th className="whitespace-nowrap py-2 pr-3">Sale</th>
                <th className="whitespace-nowrap py-2 pr-3">Unit profit</th>
                <th className="whitespace-nowrap py-2 pr-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-2 text-slate-600">
                    No products yet.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const unitProfit = Number(p.unit_sale_price) - Number(p.unit_cost_price);
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 pr-3">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-8 w-8 rounded-md object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-slate-100" />
                        )}
                      </td>
                      <td className="py-2 pr-3 font-medium">{p.name}</td>
                      <td className="py-2 pr-3">
                        {p.unit_name} {p.unit_symbol ? `(${p.unit_symbol})` : ""}
                      </td>
                      <td className="py-2 pr-3">{formatMoney(Number(p.unit_cost_price), user.storeCurrency)}</td>
                      <td className="py-2 pr-3">{formatMoney(Number(p.unit_sale_price), user.storeCurrency)}</td>
                      <td className="py-2 pr-3">{formatMoney(unitProfit, user.storeCurrency)}</td>
                      <td className="py-2 pr-3">
                        {Number(p.stock_qty).toFixed(2)} {p.unit_symbol ?? ""}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
