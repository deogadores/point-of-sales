import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { getSaleDetail } from "@/lib/pos";

export const runtime = "nodejs";

export default async function SaleDetailPage({
  params
}: {
  params: { id: string };
}) {
  const { id } = params;
  const saleId = Number(id);
  const detail = await getSaleDetail(saleId);

  if (!detail) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Sale not found</div>
        <Link className="mt-3 inline-block rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50" href="/sales">
          Back to sales
        </Link>
      </div>
    );
  }

  const { sale, items } = detail;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Sale #{sale.id}</div>
            <div className="mt-1 text-xs text-slate-500">{String(sale.sold_at)}</div>
          </div>
          <Link
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
            href="/sales"
          >
            Back to sales
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-xs font-medium text-slate-500">Total revenue</div>
            <div className="mt-1 text-lg font-semibold">
              {formatMoney(Number(sale.total_revenue))}
            </div>
          </div>
          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-xs font-medium text-slate-500">Total profit</div>
            <div className="mt-1 text-lg font-semibold">
              {formatMoney(Number(sale.total_profit))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Items</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Qty</th>
                <th className="py-2 pr-3">Unit sale</th>
                <th className="py-2 pr-3">Unit cost</th>
                <th className="py-2 pr-3">Line revenue</th>
                <th className="py-2 pr-3">Line profit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any) => (
                <tr key={it.id} className="border-t">
                  <td className="py-2 pr-3 font-medium">{it.product_name}</td>
                  <td className="py-2 pr-3">
                    {Number(it.quantity).toFixed(2)} {it.unit_symbol ?? ""}
                  </td>
                  <td className="py-2 pr-3">{formatMoney(Number(it.unit_sale_price))}</td>
                  <td className="py-2 pr-3">{formatMoney(Number(it.unit_cost_price))}</td>
                  <td className="py-2 pr-3">{formatMoney(Number(it.line_revenue))}</td>
                  <td className="py-2 pr-3">{formatMoney(Number(it.line_profit))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

