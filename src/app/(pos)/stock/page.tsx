import { addStockMovementAction } from "@/app/(pos)/actions";
import { requireAuth } from "@/lib/auth";
import { listProductsWithStock, listRecentStockMovements } from "@/lib/pos";

export const runtime = "nodejs";

export default async function StockPage() {
  const user = await requireAuth();
  const [products, recent] = await Promise.all([
    listProductsWithStock(user.storeId),
    listRecentStockMovements(user.storeId, 25)
  ]);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm font-semibold">Stock adjustment</div>
        <p className="mt-1 text-xs text-slate-500">
          Add positive quantity to receive stock; add negative quantity to remove stock.
        </p>

        <form action={addStockMovementAction} className="mt-4 grid gap-2 sm:grid-cols-6">
          <label className="sm:col-span-3">
            <div className="text-xs font-medium text-slate-600">Product</div>
            <select
              name="productId"
              className="field"
              required
              defaultValue={products[0]?.id ?? ""}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-1">
            <div className="text-xs font-medium text-slate-600">Quantity</div>
            <input
              name="quantity"
              type="number"
              step="0.01"
              className="field"
              placeholder="e.g. 10"
              required
            />
          </label>

          <label className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-600">Reason</div>
            <input
              name="reason"
              className="field"
              placeholder="e.g. Supplier delivery"
            />
          </label>

          <div className="sm:col-span-6">
            <button className="btn btn-primary w-full sm:w-auto">
              Save adjustment
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="card">
          <div className="text-sm font-semibold">Current stock</div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-2 text-slate-600">
                      No products yet.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 pr-3 font-medium">{p.name}</td>
                      <td className="py-2 pr-3">
                        {Number(p.stock_qty).toFixed(2)} {p.unit_symbol ?? ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="text-sm font-semibold">Recent stock movements</div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-2 text-slate-600">
                      No movements yet.
                    </td>
                  </tr>
                ) : (
                  recent.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-3 text-xs text-slate-600">
                        {String(r.created_at)}
                      </td>
                      <td className="py-2 pr-3 font-medium">{r.product_name}</td>
                      <td className="py-2 pr-3">
                        {Number(r.quantity).toFixed(2)} {r.unit_symbol ?? ""}
                      </td>
                      <td className="py-2 pr-3">{r.reason ?? ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

