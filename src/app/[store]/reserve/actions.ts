"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { createReservation, uploadPaymentProof } from "@/lib/reservations";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";
import { logAudit } from "@/lib/audit";

async function getStoreBySlug(slug: string) {
  const [store] = await db.select({ id: stores.id, slug: stores.slug }).from(stores).where(eq(stores.slug, slug)).limit(1);
  return store ?? null;
}

export async function createReservationAction(formData: FormData) {
  const storeSlug = String(formData.get("storeSlug") ?? "");
  const itemsJson = String(formData.get("itemsJson") ?? "[]");
  const items = JSON.parse(itemsJson);

  const store = await getStoreBySlug(storeSlug);
  if (!store) throw new Error("Invalid store.");

  const customerName = String(formData.get("customerName") ?? "");
  const reservationId = await createReservation(store.id, {
    customerName,
    customerEmail: String(formData.get("customerEmail") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    items
  });
  await logAudit(store.id, {
    action: "reservation.created",
    entityType: "reservation",
    entityId: reservationId,
    detail: `Reservation #${reservationId} by ${customerName}`,
  });

  const jar = await cookies();
  jar.set(`reservation_${storeSlug}`, String(reservationId), {
    httpOnly: true,
    sameSite: "lax",
    path: `/${storeSlug}/reserve`,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect(`/${storeSlug}/reserve/${reservationId}`);
}

export async function clearReservationCookieAction(storeSlug: string) {
  const jar = await cookies();
  jar.delete(`reservation_${storeSlug}`);
}

export async function uploadPaymentProofAction(formData: FormData) {
  const storeSlug = String(formData.get("storeSlug") ?? "");
  const reservationId = Number(formData.get("reservationId"));
  const proof = String(formData.get("proof") ?? "");
  const mime = String(formData.get("mime") ?? "image/jpeg");

  const store = await getStoreBySlug(storeSlug);
  if (!store || !reservationId || !proof) throw new Error("Missing required fields.");
  if (proof.length > 7_000_000) throw new Error("Image is too large. Please upload a smaller image.");

  await uploadPaymentProof(store.id, reservationId, proof, mime);
  await logAudit(store.id, {
    action: "reservation.payment_proof_uploaded",
    entityType: "reservation",
    entityId: reservationId,
    detail: `Reservation #${reservationId}`,
  });
  redirect(`/${storeSlug}/reserve/${reservationId}`);
}
