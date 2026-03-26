import Link from "next/link";
import { formatMoney, formatDate } from "@/lib/format";
import { requireAuth } from "@/lib/auth";
import { listProductsWithStock, querySales } from "@/lib/pos";
import { SalesFilterForm } from "@/app/(pos)/sales/SalesFilterForm";

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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const sp = await searchParams;
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

        <SalesFilterForm
          products={products.map((p) => ({ id: p.id, name: String(p.name) }))}
          startDate={startDate}
          endDate={endDate}
          productIdStr={productIdStr}
        />
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

        {/* Mobile card layout */}
        <div className="mt-3 space-y-2 md:hidden">
          {rows.length === 0 ? (
            <div className="py-2 text-sm text-slate-600">No matching sales.</div>
          ) : (
            rows.map((r: any) => (
              <Link
                key={r.id}
                href={`/sales/${r.id}`}
                className="block rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100"
              >
                <div className="space-y-1 text-sm text-slate-600">
                  <div>Date: {formatDate(r.sold_at)}</div>
                  <div>Items: {r.item_count}</div>
                  <div>Revenue: {formatMoney(Number(r.total_revenue), user.storeCurrency)}</div>
                  <div>Profit: {formatMoney(Number(r.total_profit), user.storeCurrency)}</div>
                </div>
              </Link>
            ))
          )}
        </div>
        {/* Desktop table layout */}
        <div className="mt-3 hidden w-full overflow-x-auto no-scrollbar md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="whitespace-nowrap py-2 pr-3">Date</th>
                <th className="whitespace-nowrap py-2 pr-3">Items</th>
                <th className="whitespace-nowrap py-2 pr-3">Revenue</th>
                <th className="whitespace-nowrap py-2 pr-3">Profit</th>
                <th className="whitespace-nowrap py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-2 text-slate-600">
                    No matching sales.
                  </td>
                </tr>
              ) : (
                rows.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 pr-3 text-xs text-slate-600">
                      {formatDate(r.sold_at)}
                    </td>
                    <td className="py-2 pr-3">{r.item_count}</td>
                    <td className="py-2 pr-3">{formatMoney(Number(r.total_revenue), user.storeCurrency)}</td>
                    <td className="py-2 pr-3">{formatMoney(Number(r.total_profit), user.storeCurrency)}</td>
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

