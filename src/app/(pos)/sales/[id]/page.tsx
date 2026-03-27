import Link from "next/link";
import { formatMoney, formatDate } from "@/lib/format";
import { requireAuth } from "@/lib/auth";
import { getSaleDetail } from "@/lib/pos";

export const runtime = "nodejs";

export default async function SaleDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const saleId = Number(id);
  const detail = await getSaleDetail(user.storeId, saleId);

  if (!detail) {
    return (
      <div className="card">
        <div className="text-sm font-semibold">Sale not found</div>
        <Link className="btn btn-ghost mt-3 inline-flex" href="/sales">
          Back to sales
        </Link>
      </div>
    );
  }

  const { sale, items } = detail;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Sale #{sale.id}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(sale.sold_at, user.storeTimezone)}</div>
            {sale.processed_by_name && (
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Processed by {sale.processed_by_name}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sale.reservation_id && (
              <Link className="btn btn-ghost" href={`/reservations/${sale.reservation_id}?from=/sales/${sale.id}`}>
                Reservation #{sale.reservation_id}
              </Link>
            )}
            <Link className="btn btn-ghost" href="/sales">
              Back to sales
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-gray-700/60 dark:bg-gray-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total revenue</div>
            <div className="mt-1 text-lg font-semibold">
              {formatMoney(Number(sale.total_revenue), user.storeCurrency)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-gray-700/60 dark:bg-gray-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total profit</div>
            <div className="mt-1 text-lg font-semibold">
              {formatMoney(Number(sale.total_profit), user.storeCurrency)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-sm font-semibold">Items</div>
        {/* Mobile card layout */}
        <div className="mt-3 space-y-2 md:hidden">
          {items.map((it: any) => (
            <div key={it.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="font-medium">{it.product_name}</div>
              <div className="mt-1 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  Qty: {Number(it.quantity).toFixed(2)} {it.unit_symbol ?? ""}
                </div>
                <div>Unit sale: {formatMoney(Number(it.unit_sale_price), user.storeCurrency)}</div>
                <div>Unit cost: {formatMoney(Number(it.unit_cost_price), user.storeCurrency)}</div>
                <div>Line revenue: {formatMoney(Number(it.line_revenue), user.storeCurrency)}</div>
                <div>Line profit: {formatMoney(Number(it.line_profit), user.storeCurrency)}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop table layout */}
        <div className="mt-3 hidden w-full overflow-x-auto no-scrollbar md:block">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="text-left text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="whitespace-nowrap py-2 pr-3">Product</th>
                <th className="whitespace-nowrap py-2 pr-3">Qty</th>
                <th className="whitespace-nowrap py-2 pr-3">Unit sale</th>
                <th className="whitespace-nowrap py-2 pr-3">Unit cost</th>
                <th className="whitespace-nowrap py-2 pr-3">Line revenue</th>
                <th className="whitespace-nowrap py-2 pr-3">Line profit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any) => (
                <tr key={it.id} className="border-t dark:border-gray-700">
                  <td className="py-2 pr-3 font-medium">{it.product_name}</td>
                  <td className="py-2 pr-3">
                    {Number(it.quantity).toFixed(2)} {it.unit_symbol ?? ""}
                  </td>
                  <td className="py-2 pr-3">{formatMoney(Number(it.unit_sale_price), user.storeCurrency)}</td>
                  <td className="py-2 pr-3">{formatMoney(Number(it.unit_cost_price), user.storeCurrency)}</td>
                  <td className="py-2 pr-3">{formatMoney(Number(it.line_revenue), user.storeCurrency)}</td>
                  <td className="py-2 pr-3">{formatMoney(Number(it.line_profit), user.storeCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

