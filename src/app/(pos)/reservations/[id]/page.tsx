import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import {
  getReservationDetail,
  RESERVATION_STATUSES,
  STATUS_LABELS,
  type ReservationStatus
} from "@/lib/reservations";
import { updateReservationStatusAction } from "@/app/(pos)/actions";
import { formatMoney, formatDate } from "@/lib/format";
import { ReservationAutoRefresh } from "@/app/(pos)/reservations/[id]/ReservationAutoRefresh";

export const runtime = "nodejs";

const STATUS_COLORS: Record<ReservationStatus, string> = {
  created: "bg-slate-100 text-slate-700",
  waiting_for_payment: "bg-amber-100 text-amber-700",
  payment_sent: "bg-blue-100 text-blue-700",
  payment_confirmed: "bg-green-100 text-green-700",
  completed: "bg-indigo-100 text-indigo-700"
};

const NEXT_STATUS_LABELS: Record<ReservationStatus, string> = {
  created: "Mark as Waiting for Payment",
  waiting_for_payment: "Mark as Payment Sent",
  payment_sent: "Confirm Payment",
  payment_confirmed: "Mark as Completed",
  completed: ""
};

const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus | null> = {
  created: "waiting_for_payment",
  waiting_for_payment: "payment_sent",
  payment_sent: "payment_confirmed",
  payment_confirmed: "completed",
  completed: null
};

export default async function ReservationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reservationId = Number(id);
  if (!reservationId) notFound();

  const user = await requireAuth();
  const data = await getReservationDetail(user.storeId, reservationId);
  if (!data) notFound();

  const { reservation, items } = data;
  const status = reservation.status as ReservationStatus;
  const currentStep = RESERVATION_STATUSES.indexOf(status);
  const nextStatus = VALID_TRANSITIONS[status];

  return (
    <div className="space-y-4">
      <ReservationAutoRefresh reservationId={reservationId} />
      <div className="card flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href="/reservations" className="btn btn-ghost text-xs">
            ← Reservations
          </Link>
          <div>
            <div className="text-sm font-semibold">Reservation #{reservation.id}</div>
            <div className="text-xs text-slate-500">{formatDate(String(reservation.createdAt))}</div>
          </div>
        </div>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="flex items-center">
          {RESERVATION_STATUSES.map((s, idx) => {
            const done = idx <= currentStep;
            const isLast = idx === RESERVATION_STATUSES.length - 1;
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      done ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                    }`}
                  />
                  <span className="text-[10px] text-center text-slate-500 leading-tight w-16 hidden sm:block">
                    {STATUS_LABELS[s]}
                  </span>
                </div>
                {!isLast && (
                  <div className={`flex-1 h-0.5 mx-1 ${idx < currentStep ? "bg-indigo-600" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Customer info */}
        <div className="card space-y-1 text-sm">
          <div className="font-semibold mb-2">Customer</div>
          <div>{reservation.customerName}</div>
          {reservation.customerEmail && <div className="text-slate-500">{reservation.customerEmail}</div>}
          {reservation.customerPhone && <div className="text-slate-500">{reservation.customerPhone}</div>}
          {reservation.notes && (
            <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">{reservation.notes}</div>
          )}
          <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
            Updated {formatDate(String(reservation.updatedAt))}
          </div>
        </div>

        {/* Order items */}
        <div className="card space-y-3">
          <div className="font-semibold text-sm">Order items</div>
          {items.map((item: any) => (
            <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
              <div>
                <div>{item.product_name}</div>
                <div className="text-xs text-slate-500">
                  {formatMoney(item.unit_sale_price, user.storeCurrency)} × {item.quantity} {item.unit_symbol ?? ""}
                </div>
              </div>
              <div className="font-medium whitespace-nowrap">{formatMoney(item.subtotal, user.storeCurrency)}</div>
            </div>
          ))}
          <div className="border-t border-slate-200 pt-3 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{formatMoney(reservation.totalAmount, user.storeCurrency)}</span>
          </div>
        </div>
      </div>

      {/* Payment proof */}
      {reservation.paymentProof && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">Payment proof</div>
            <a
              href={`data:${reservation.paymentProofMime};base64,${reservation.paymentProof}`}
              download={`payment-proof-${reservation.id}.${reservation.paymentProofMime === "image/png" ? "png" : "jpg"}`}
              className="btn btn-ghost text-xs"
            >
              Download
            </a>
          </div>
          <img
            src={`data:${reservation.paymentProofMime};base64,${reservation.paymentProof}`}
            alt="Payment proof"
            className="max-h-72 rounded-xl object-contain border border-slate-200"
          />
        </div>
      )}

      {/* Status update */}
      {nextStatus && (
        <div className="card">
          <div className="font-semibold text-sm mb-2">Update status</div>
          <form action={updateReservationStatusAction}>
            <input type="hidden" name="reservationId" value={reservation.id} />
            <input type="hidden" name="status" value={nextStatus} />
            <button type="submit" className="btn btn-primary">
              {NEXT_STATUS_LABELS[status]}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
