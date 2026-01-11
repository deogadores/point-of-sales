import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { requireAuth } from "@/lib/auth";
import { listProductsWithStock, querySales } from "@/lib/pos";

export const runtime = "nodejs";

function toStartOfDay(date: string) {
  return `${date} 00:00:00`;
}

function toEndOfDay(date: string) {
  return `${date} 23:59:59`;
}

export default async function SalesQueryPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireAuth();
  const sp = searchParams;
  const startDate = typeof sp.start === "string" ? sp.start : "";
  const endDate = typeof sp.end === "string" ? sp.end : "";
  const productIdStr = typeof sp.productId === "string" ? sp.productId : "";
  const productId = productIdStr ? Number(productIdStr) : undefined;

  const [products, rows] = await Promise.all([
    listProductsWithStock(user.storeId),
    querySales(user.storeId, {
      start: startDate ? toStartOfDay(startDate) : undefined,
      end: endDate ? toEndOfDay(endDate) : undefined,
      productId: productId && Number.isFinite(productId) ? productId : undefined
    })
  ]);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm font-semibold">Sales query</div>
        <p className="mt-1 text-xs text-slate-500">
          Filter by date range and optionally by product.
        </p>

        <form className="mt-4 grid gap-2 sm:grid-cols-6">
          <label className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-600">Start date</div>
            <input
              name="start"
              type="date"
              defaultValue={startDate}
              className="field"
            />
          </label>

          <label className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-600">End date</div>
            <input
              name="end"
              type="date"
              defaultValue={endDate}
              className="field"
            />
          </label>

          <label className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-600">Product (optional)</div>
            <select
              name="productId"
              defaultValue={productIdStr}
              className="field"
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
            <button className="btn btn-primary w-full sm:w-auto">
              Run query
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold">Results</div>
          <Link
            className="btn btn-ghost"
            href="/sales/new"
          >
            New sale
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto no-scrollbar lg:overflow-x-visible">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-3">Sale #</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Items</th>
                <th className="py-2 pr-3">Revenue</th>
                <th className="py-2 pr-3">Profit</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-2 text-slate-600">
                    No matching sales.
                  </td>
                </tr>
              ) : (
                rows.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 pr-3 font-medium">{r.id}</td>
                    <td className="py-2 pr-3 text-xs text-slate-600">
                      {String(r.sold_at)}
                    </td>
                    <td className="py-2 pr-3">{r.item_count}</td>
                    <td className="py-2 pr-3">{formatMoney(Number(r.total_revenue))}</td>
                    <td className="py-2 pr-3">{formatMoney(Number(r.total_profit))}</td>
                    <td className="py-2 pr-3">
                      <Link
                        className="btn btn-ghost px-3 py-1.5 text-xs"
                        href={`/sales/${r.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

