import Link from "next/link";
import { createProductAction } from "@/app/(pos)/actions";
import { formatMoney } from "@/lib/format";
import { requireAuth } from "@/lib/auth";
import { listProductsWithStock, listUnits } from "@/lib/pos";

export const runtime = "nodejs";

export default async function ProductsPage() {
  const user = await requireAuth();
  const [products, units] = await Promise.all([
    listProductsWithStock(user.storeId),
    listUnits()
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
          <Link
            className="btn btn-ghost"
            href="/reference/units"
          >
            Maintain units
          </Link>
        </div>

        <form
          action={createProductAction}
          className="mt-4 grid gap-2 sm:grid-cols-6"
        >
          <label className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-600">Name</div>
            <input
              name="name"
              placeholder="e.g. Coffee beans"
              className="field"
              required
            />
          </label>

          <label className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-600">Unit</div>
            <select
              name="unitId"
              className="field"
              required
              defaultValue={units[0]?.id ?? ""}
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.symbol ? `(${u.symbol})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-1">
            <div className="text-xs font-medium text-slate-600">Unit cost</div>
            <input
              name="unitCostPrice"
              type="number"
              step="0.01"
              min="0"
              className="field"
              required
            />
          </label>

          <label className="sm:col-span-1">
            <div className="text-xs font-medium text-slate-600">Sale price</div>
            <input
              name="unitSalePrice"
              type="number"
              step="0.01"
              min="0"
              className="field"
              required
            />
          </label>

          <div className="sm:col-span-6">
            <button className="btn btn-primary w-full sm:w-auto">
              Add product
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="text-sm font-semibold">Product list</div>
        <div className="mt-3 overflow-x-auto no-scrollbar lg:overflow-x-visible">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Unit</th>
                <th className="py-2 pr-3">Cost</th>
                <th className="py-2 pr-3">Sale</th>
                <th className="py-2 pr-3">Unit profit</th>
                <th className="py-2 pr-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-2 text-slate-600">
                    No products yet.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const unitProfit = Number(p.unit_sale_price) - Number(p.unit_cost_price);
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 pr-3 font-medium">{p.name}</td>
                      <td className="py-2 pr-3">
                        {p.unit_name} {p.unit_symbol ? `(${p.unit_symbol})` : ""}
                      </td>
                      <td className="py-2 pr-3">{formatMoney(Number(p.unit_cost_price))}</td>
                      <td className="py-2 pr-3">{formatMoney(Number(p.unit_sale_price))}</td>
                      <td className="py-2 pr-3">{formatMoney(unitProfit)}</td>
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

