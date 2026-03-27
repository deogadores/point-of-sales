import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Link from "next/link";
import { ReserveClient } from "@/app/[store]/reserve/ReserveClient";
import { ReserveHeader } from "@/app/[store]/reserve/ReserveHeader";
import { listProductsWithStock } from "@/lib/pos";
import { db } from "@/lib/db";
import { stores, reservations } from "@/lib/db/schema";
import { STATUS_LABELS, type ReservationStatus } from "@/lib/reservations";

export const runtime = "nodejs";

async function getStore(slug: string) {
  const [store] = await db
    .select({ id: stores.id, name: stores.name, slug: stores.slug, currency: stores.currency })
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);
  return store ?? null;
}

export default async function ReservePage({
  params
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;

  const storeRecord = await getStore(store);
  if (!storeRecord) notFound();

  const jar = await cookies();
  const savedId = Number(jar.get(`reservation_${store}`)?.value ?? 0);
  let savedReservation: { id: number; status: string } | null = null;
  if (savedId) {
    const [row] = await db
      .select({ id: reservations.id, status: reservations.status })
      .from(reservations)
      .where(and(eq(reservations.storeId, storeRecord.id), eq(reservations.id, savedId)))
      .limit(1);
    if (row && row.status !== "completed") savedReservation = row;
  }

  const products = await listProductsWithStock(storeRecord.id);

  const serialized = products.map((p) => ({
    id: Number(p.id),
    name: String(p.name),
    image_url: p.image_url ? String(p.image_url) : null,
    unit_sale_price: Number(p.unit_sale_price),
    unit_symbol: p.unit_symbol ? String(p.unit_symbol) : null,
    stock_qty: Number(p.stock_qty)
  }));

  return (
    <div className="flex-1">
      <ReserveHeader
        left={<div className="text-sm font-semibold">{storeRecord.name}</div>}
        right="Reserve products online"
      />
      <main className="mx-auto max-w-5xl p-3 sm:p-4 space-y-4">
        {savedReservation && (
          <Link href={`/${store}/reserve/${savedReservation.id}`} className="card flex items-center justify-between gap-3 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30">
            <div>
              <div className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">You have an active reservation</div>
              <div className="text-xs text-indigo-600 mt-0.5 dark:text-indigo-400">
                #{savedReservation.id} · {STATUS_LABELS[savedReservation.status as ReservationStatus]}
              </div>
            </div>
            <span className="text-xs text-indigo-500 shrink-0 dark:text-indigo-400">View →</span>
          </Link>
        )}
        <div className="card">
          <div className="text-sm font-semibold">Browse &amp; Reserve</div>
          <p className="mt-1 text-xs text-slate-500">
            Add items to your cart and place a reservation. You will receive a link to track your order and submit payment.
          </p>
        </div>
        <ReserveClient storeSlug={storeRecord.slug} products={serialized} currency={storeRecord.currency} />
      </main>
    </div>
  );
}
