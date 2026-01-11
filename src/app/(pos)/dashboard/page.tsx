import { formatMoney } from "@/lib/format";
import { requireAuth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/pos";

export const runtime = "nodejs";

function StatCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="card">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const stats = await getDashboardStats(user.storeId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total revenue" value={formatMoney(stats.revenue)} />
        <StatCard label="Total profit" value={formatMoney(stats.profit)} />
        <StatCard label="Sales count" value={String(stats.salesCount)} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="card">
          <div className="text-sm font-semibold">Top products</div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Qty sold</th>
                  <th className="py-2 pr-3">Revenue</th>
                  <th className="py-2 pr-3">Profit</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.length === 0 ? (
                  <tr>
                    <td className="py-2 text-slate-600" colSpan={4}>
                      No sales yet.
                    </td>
                  </tr>
                ) : (
                  stats.topProducts.map((r: any) => (
                    <tr key={r.product_id} className="border-t">
                      <td className="py-2 pr-3 font-medium">{r.product_name}</td>
                      <td className="py-2 pr-3">{Number(r.qty_sold).toFixed(2)}</td>
                      <td className="py-2 pr-3">{formatMoney(Number(r.revenue))}</td>
                      <td className="py-2 pr-3">{formatMoney(Number(r.profit))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="text-sm font-semibold">Lowest stock (quick view)</div>
          <p className="mt-1 text-xs text-slate-500">
            Stock is computed as sum of stock movements minus sales.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStock.length === 0 ? (
                  <tr>
                    <td className="py-2 text-slate-600" colSpan={2}>
                      No products yet.
                    </td>
                  </tr>
                ) : (
                  stats.lowStock.map((r: any) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-3 font-medium">{r.name}</td>
                      <td className="py-2 pr-3">
                        {Number(r.stock_qty).toFixed(2)} {r.unit_symbol ?? ""}
                      </td>
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

