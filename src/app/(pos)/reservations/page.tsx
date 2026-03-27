import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { listReservations } from "@/lib/reservations";
import { STATUS_LABELS, type ReservationStatus } from "@/lib/reservations";
import { formatMoney, formatDate } from "@/lib/format";

export const runtime = "nodejs";

const STATUS_COLORS: Record<ReservationStatus, string> = {
  created: "bg-slate-100 text-slate-700",
  waiting_for_payment: "bg-amber-100 text-amber-700",
  payment_sent: "bg-blue-100 text-blue-700",
  payment_confirmed: "bg-green-100 text-green-700",
  completed: "bg-indigo-100 text-indigo-700"
};

export default async function ReservationsPage() {
  const user = await requireAuth();
  const reservations = await listReservations(user.storeId);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Reservations</div>
          <p className="mt-1 text-xs text-slate-500">Customer reservations and their payment status.</p>
        </div>
        <Link href={`/${user.storeSlug}/reserve`} target="_blank" className="btn btn-ghost text-xs">
          Customer page ↗
        </Link>
      </div>

      {reservations.length === 0 ? (
        <div className="card text-sm text-slate-600">No reservations yet.</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {reservations.map((r: any) => (
              <Link key={r.id} href={`/reservations/${r.id}`} className="card block hover:border-indigo-300 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">#{r.id} · {r.customer_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{formatDate(String(r.created_at), user.storeTimezone)}</div>
                    {r.customer_email && <div className="text-xs text-slate-500">{r.customer_email}</div>}
                  </div>
                  <span className={`shrink-0 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[r.status as ReservationStatus]}`}>
                    {STATUS_LABELS[r.status as ReservationStatus]}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-600">
                  <span>{r.item_count} item{r.item_count !== 1 ? "s" : ""}</span>
                  <span className="font-medium">{formatMoney(r.total_amount, user.storeCurrency)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="card hidden md:block overflow-x-auto no-scrollbar">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Items</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {reservations.map((r: any) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2 pr-4 text-slate-500">{r.id}</td>
                    <td className="py-2 pr-4">
                      <div>{r.customer_name}</div>
                      {r.customer_email && <div className="text-xs text-slate-500">{r.customer_email}</div>}
                    </td>
                    <td className="py-2 pr-4">{r.item_count}</td>
                    <td className="py-2 pr-4 font-medium">{formatMoney(r.total_amount, user.storeCurrency)}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[r.status as ReservationStatus]}`}>
                        {STATUS_LABELS[r.status as ReservationStatus]}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-500">{formatDate(String(r.created_at), user.storeTimezone)}</td>
                    <td className="py-2">
                      <Link href={`/reservations/${r.id}`} className="btn btn-ghost px-3 py-1.5 text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
