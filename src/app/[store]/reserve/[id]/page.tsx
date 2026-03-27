import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";
import {
  getReservationForStore,
  RESERVATION_STATUSES,
  STATUS_LABELS,
  type ReservationStatus
} from "@/lib/reservations";
import { formatMoney, formatDate } from "@/lib/format";
import { PaymentUpload } from "@/app/[store]/reserve/[id]/PaymentUpload";
import { ReservationStatusWatcher } from "@/app/[store]/reserve/[id]/ReservationStatusWatcher";
import { ReserveHeader } from "@/app/[store]/reserve/ReserveHeader";
import { ClearReservationCookie } from "@/app/[store]/reserve/[id]/ClearReservationCookie";

export const runtime = "nodejs";

const STATUS_COLORS: Record<ReservationStatus, string> = {
  created: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  waiting_for_payment: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  payment_sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  payment_confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
};

export default async function ReservationStatusPage({
  params
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store, id } = await params;
  const reservationId = Number(id);
  if (!store || !reservationId) notFound();

  const [storeRow] = await db.select({ id: stores.id, currency: stores.currency, timezone: stores.timezone }).from(stores).where(eq(stores.slug, store)).limit(1);
  if (!storeRow) notFound();

  const data = await getReservationForStore(storeRow.id, reservationId);
  if (!data) notFound();

  const { reservation, items } = data;
  const status = reservation.status as ReservationStatus;
  const currentStep = RESERVATION_STATUSES.indexOf(status);


  return (
    <div className="flex-1">
      <ReservationStatusWatcher storeSlug={store} reservationId={reservationId} currentStatus={status} />
      {status === "completed" && <ClearReservationCookie storeSlug={store} />}
      <ReserveHeader
        left={<Link href={`/${store}/reserve`} className="text-sm font-semibold">← Back to store</Link>}
        right={`Reservation #${reservation.id}`}
      />

      <main className="mx-auto max-w-3xl p-3 sm:p-4 space-y-4">
        {/* Status badge */}
        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Reservation #{reservation.id}</div>
              <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">Created {formatDate(String(reservation.createdAt), storeRow.timezone)}</div>
            </div>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>

          {/* Timeline */}
          <div className="mt-4 flex items-center">
            {RESERVATION_STATUSES.map((s, idx) => {
              const done = idx <= currentStep;
              const isLast = idx === RESERVATION_STATUSES.length - 1;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        done ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300 dark:bg-gray-900 dark:border-gray-600"
                      }`}
                    />
                    <span className="text-[10px] text-center text-slate-500 leading-tight w-14 hidden sm:block dark:text-slate-400">
                      {STATUS_LABELS[s]}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-1 ${idx < currentStep ? "bg-indigo-600" : "bg-slate-200 dark:bg-gray-700"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer info */}
        <div className="card space-y-1 text-sm">
          <div className="font-semibold mb-2">Customer</div>
          <div>{reservation.customerName}</div>
          {reservation.customerEmail && <div className="text-slate-500 dark:text-slate-400">{reservation.customerEmail}</div>}
          {reservation.customerPhone && <div className="text-slate-500 dark:text-slate-400">{reservation.customerPhone}</div>}
          {reservation.notes && (
            <div className="mt-2 text-xs text-slate-500 border-t pt-2 dark:text-slate-400 dark:border-gray-700">{reservation.notes}</div>
          )}
        </div>

        {/* Order items */}
        <div className="card space-y-3">
          <div className="font-semibold text-sm">Order items</div>
          {items.map((item: any) => (
            <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
              <div>
                <div>{item.product_name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {formatMoney(item.unit_sale_price, storeRow.currency)} × {item.quantity} {item.unit_symbol ?? ""}
                </div>
              </div>
              <div className="font-medium whitespace-nowrap">{formatMoney(item.subtotal, storeRow.currency)}</div>
            </div>
          ))}
          <div className="border-t border-slate-200 pt-3 flex justify-between text-sm font-semibold dark:border-gray-700">
            <span>Total</span>
            <span>{formatMoney(reservation.totalAmount, storeRow.currency)}</span>
          </div>
        </div>

        {/* Payment section */}
        {status === "waiting_for_payment" && (
          <div className="card space-y-3">
            <div className="font-semibold text-sm">Upload payment proof</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please complete your payment and upload a screenshot or photo of your proof of payment below.
            </p>
            <PaymentUpload storeSlug={store} reservationId={Number(reservation.id)} />
          </div>
        )}

        {status === "payment_sent" && (
          <div className="card bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50">
            <div className="font-semibold text-sm text-blue-800 dark:text-blue-300">Payment proof received</div>
            <p className="text-xs text-blue-600 mt-1 dark:text-blue-400">
              We have received your payment proof and are reviewing it. You will be notified once confirmed.
            </p>
            {reservation.paymentProof && (
              <img
                src={`data:${reservation.paymentProofMime};base64,${reservation.paymentProof}`}
                alt="Payment proof"
                className="mt-3 max-h-48 rounded-lg object-contain"
              />
            )}
          </div>
        )}

        {status === "payment_confirmed" && (
          <div className="card bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50">
            <div className="font-semibold text-sm text-green-800 dark:text-green-300">Payment confirmed!</div>
            <p className="text-xs text-green-600 mt-1 dark:text-green-400">
              Your payment has been confirmed. Your reservation is being prepared.
            </p>
          </div>
        )}

        {status === "completed" && (
          <div className="card bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-900/50">
            <div className="font-semibold text-sm text-indigo-800 dark:text-indigo-300">Reservation completed</div>
            <p className="text-xs text-indigo-600 mt-1 dark:text-indigo-400">
              Your reservation has been completed. Thank you for your order!
            </p>
          </div>
        )}

        {status === "created" && (
          <div className="card bg-slate-50 dark:bg-gray-800">
            <div className="font-semibold text-sm">Awaiting store confirmation</div>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
              Your reservation has been received. The store will review it and provide payment instructions shortly.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
