import { z } from "zod";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, units, reservations, reservationItems, sales, saleItems, stockMovements } from "@/lib/db/schema";

export const RESERVATION_STATUSES = [
  "created",
  "waiting_for_payment",
  "payment_sent",
  "payment_confirmed",
  "completed"
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  created: "Created",
  waiting_for_payment: "Waiting for Payment",
  payment_sent: "Payment Sent",
  payment_confirmed: "Payment Confirmed",
  completed: "Completed"
};

const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  created: ["waiting_for_payment"],
  waiting_for_payment: ["payment_sent"],
  payment_sent: ["payment_confirmed"],
  payment_confirmed: ["completed"],
  completed: []
};

const ReservationItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().positive()
});

export const ReservationInputSchema = z.object({
  customerName: z.string().trim().min(1).max(128),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  customerPhone: z.string().trim().min(1).max(32),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z.array(ReservationItemInputSchema).min(1)
});

const reservationItemsSelect = {
  id: reservationItems.id,
  product_id: reservationItems.productId,
  product_name: products.name,
  quantity: reservationItems.quantity,
  unit_sale_price: reservationItems.unitSalePrice,
  subtotal: reservationItems.subtotal,
  unit_symbol: units.symbol,
} as const;

async function getReservationItems(reservationId: number) {
  return db
    .select(reservationItemsSelect)
    .from(reservationItems)
    .innerJoin(products, eq(products.id, reservationItems.productId))
    .innerJoin(units, eq(units.id, products.unitId))
    .where(eq(reservationItems.reservationId, reservationId))
    .orderBy(asc(reservationItems.id));
}

export async function createReservation(storeId: number, input: unknown) {
  const data = ReservationInputSchema.parse(input);

  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const productRows = await db
    .select({ id: products.id, unitSalePrice: products.unitSalePrice })
    .from(products)
    .where(and(eq(products.storeId, storeId), inArray(products.id, productIds)));

  const productMap = new Map(productRows.map((r) => [r.id, r]));

  const enriched = data.items.map((i) => {
    const p = productMap.get(i.productId);
    if (!p) throw new Error(`Unknown product id ${i.productId}`);
    const unitSalePrice = p.unitSalePrice;
    return { productId: i.productId, quantity: i.quantity, unitSalePrice, subtotal: unitSalePrice * i.quantity };
  });

  const totalAmount = enriched.reduce((acc, it) => acc + it.subtotal, 0);

  return db.transaction(async (tx) => {
    const [res] = await tx
      .insert(reservations)
      .values({
        storeId,
        customerName: data.customerName,
        customerEmail: data.customerEmail?.length ? data.customerEmail : null,
        customerPhone: data.customerPhone?.length ? data.customerPhone : null,
        totalAmount,
        notes: data.notes?.length ? data.notes : null,
      })
      .returning({ id: reservations.id });
    if (!res) throw new Error("Failed to create reservation.");

    for (const it of enriched) {
      await tx.insert(reservationItems).values({
        reservationId: res.id,
        storeId,
        productId: it.productId,
        quantity: it.quantity,
        unitSalePrice: it.unitSalePrice,
        subtotal: it.subtotal,
      });
    }

    return res.id;
  });
}

export async function getReservation(reservationId: number) {
  const [reservation] = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1);

  if (!reservation) return null;

  const items = await getReservationItems(reservationId);
  return { reservation, items };
}

export async function uploadPaymentProof(storeId: number, reservationId: number, proof: string, mime: string) {
  const [reservation] = await db
    .select({ id: reservations.id, status: reservations.status })
    .from(reservations)
    .where(and(eq(reservations.id, reservationId), eq(reservations.storeId, storeId)))
    .limit(1);

  if (!reservation) throw new Error("Reservation not found.");
  if (reservation.status !== "waiting_for_payment") {
    throw new Error("Reservation is not currently waiting for payment.");
  }

  await db
    .update(reservations)
    .set({ status: "payment_sent", paymentProof: proof, paymentProofMime: mime, updatedAt: sql`datetime('now')` })
    .where(eq(reservations.id, reservationId));
}

export async function getReservationForStore(storeId: number, reservationId: number) {
  const [reservation] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.id, reservationId), eq(reservations.storeId, storeId)))
    .limit(1);

  if (!reservation) return null;

  const items = await getReservationItems(reservationId);
  return { reservation, items };
}

export async function listReservations(storeId: number) {
  return db
    .select({
      id: reservations.id,
      customer_name: reservations.customerName,
      customer_email: reservations.customerEmail,
      customer_phone: reservations.customerPhone,
      status: reservations.status,
      total_amount: reservations.totalAmount,
      created_at: reservations.createdAt,
      updated_at: reservations.updatedAt,
      item_count: count(reservationItems.id),
    })
    .from(reservations)
    .leftJoin(reservationItems, eq(reservationItems.reservationId, reservations.id))
    .where(eq(reservations.storeId, storeId))
    .groupBy(reservations.id)
    .orderBy(desc(reservations.createdAt), desc(reservations.id))
    .limit(200);
}

export async function getReservationDetail(storeId: number, reservationId: number) {
  const [reservation] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.storeId, storeId), eq(reservations.id, reservationId)))
    .limit(1);

  if (!reservation) return null;

  const items = await getReservationItems(reservationId);
  return { reservation, items };
}

export async function updateReservationStatus(storeId: number, reservationId: number, status: ReservationStatus) {
  const [reservation] = await db
    .select({ id: reservations.id, status: reservations.status })
    .from(reservations)
    .where(and(eq(reservations.storeId, storeId), eq(reservations.id, reservationId)))
    .limit(1);

  if (!reservation) throw new Error("Reservation not found.");

  const current = reservation.status as ReservationStatus;
  if (!VALID_TRANSITIONS[current]?.includes(status)) {
    throw new Error(`Cannot transition from "${current}" to "${status}".`);
  }

  if (status === "completed") {
    const items = await db
      .select({
        productId: reservationItems.productId,
        quantity: reservationItems.quantity,
        unitSalePrice: reservationItems.unitSalePrice,
        unitCostPrice: products.unitCostPrice,
      })
      .from(reservationItems)
      .innerJoin(products, eq(products.id, reservationItems.productId))
      .where(and(eq(reservationItems.reservationId, reservationId), eq(reservationItems.storeId, storeId)));

    if (items.length === 0) throw new Error("Reservation has no items.");

    const enriched = items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitCostPrice: i.unitCostPrice,
      unitSalePrice: i.unitSalePrice,
      lineRevenue: i.unitSalePrice * i.quantity,
      lineProfit: (i.unitSalePrice - i.unitCostPrice) * i.quantity,
    }));

    const totalRevenue = enriched.reduce((acc, i) => acc + i.lineRevenue, 0);
    const totalProfit = enriched.reduce((acc, i) => acc + i.lineProfit, 0);

    await db.transaction(async (tx) => {
      const [sale] = await tx
        .insert(sales)
        .values({ storeId, totalRevenue, totalProfit })
        .returning({ id: sales.id });
      if (!sale) throw new Error("Failed to create sale.");

      for (const i of enriched) {
        await tx.insert(saleItems).values({
          storeId,
          saleId: sale.id,
          productId: i.productId,
          quantity: i.quantity,
          unitCostPrice: i.unitCostPrice,
          unitSalePrice: i.unitSalePrice,
          lineRevenue: i.lineRevenue,
          lineProfit: i.lineProfit,
        });
        await tx.insert(stockMovements).values({
          storeId,
          productId: i.productId,
          quantity: -i.quantity,
          reason: `Reservation #${reservationId}`,
        });
      }

      await tx
        .update(reservations)
        .set({ status: "completed", updatedAt: sql`datetime('now')` })
        .where(and(eq(reservations.storeId, storeId), eq(reservations.id, reservationId)));
    });

    return;
  }

  await db
    .update(reservations)
    .set({ status, updatedAt: sql`datetime('now')` })
    .where(and(eq(reservations.storeId, storeId), eq(reservations.id, reservationId)));
}
