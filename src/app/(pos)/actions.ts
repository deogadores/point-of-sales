"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth, updateStoreCurrency, updateLiveNotifications, updateStoreTimezone, updateStorePaymentLink, renameStore, changeUserRole } from "@/lib/auth";
import {
  addStockMovement,
  createProduct,
  createSale,
  createUnit,
  deleteUnit
} from "@/lib/pos";
import { updateReservationStatus, type ReservationStatus } from "@/lib/reservations";
import { logAudit } from "@/lib/audit";

export async function createUnitAction(formData: FormData) {
  const user = await requireAuth();
  const name = String(formData.get("name") ?? "");
  const symbol = String(formData.get("symbol") ?? "");
  await createUnit(user.storeId, { name, symbol });
  await logAudit(user.storeId, {
    actorName: user.name,
    action: "unit.created",
    entityType: "unit",
    detail: symbol ? `${name} (${symbol})` : name,
  });
  revalidatePath("/reference/units");
  redirect("/reference/units");
}

export async function deleteUnitAction(formData: FormData) {
  const user = await requireAuth();
  const unitId = Number(formData.get("unitId"));
  await deleteUnit(user.storeId, unitId);
  await logAudit(user.storeId, {
    actorName: user.name,
    action: "unit.deleted",
    entityType: "unit",
    entityId: unitId,
    detail: `Unit #${unitId}`,
  });
  revalidatePath("/reference/units");
  redirect("/reference/units");
}

export async function createProductAction(formData: FormData) {
  const user = await requireAuth();
  const name = String(formData.get("name") ?? "");
  await createProduct(user.storeId, {
    name,
    imageUrl: String(formData.get("imageUrl") ?? ""),
    unitId: formData.get("unitId"),
    unitCostPrice: formData.get("unitCostPrice"),
    unitSalePrice: formData.get("unitSalePrice"),
    initialStock: formData.get("initialStock"),
  });
  await logAudit(user.storeId, {
    actorName: user.name,
    action: "product.created",
    entityType: "product",
    detail: name,
  });
  revalidatePath("/products");
  redirect("/products");
}

export async function addStockMovementAction(formData: FormData) {
  const user = await requireAuth();
  const quantity = Number(formData.get("quantity"));
  const reason = String(formData.get("reason") ?? "");
  await addStockMovement(user.storeId, {
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    reason,
  });
  await logAudit(user.storeId, {
    actorName: user.name,
    action: "stock.added",
    entityType: "stock",
    detail: [
      quantity > 0 ? `+${quantity}` : String(quantity),
      reason ? `• ${reason}` : "",
    ].filter(Boolean).join(" "),
  });
  revalidatePath("/stock");
  revalidatePath("/products");
  redirect("/stock");
}

// Convert a local datetime string ("YYYY-MM-DDTHH:mm") in a given IANA timezone to a
// UTC string in SQLite format ("YYYY-MM-DD HH:MM:SS").
function localToUtcSqlite(localIsoStr: string, timezone: string): string {
  const asUtc = new Date(localIsoStr + "Z");
  const inZone = new Date(asUtc.toLocaleString("en-US", { timeZone: timezone }));
  const offset = asUtc.getTime() - inZone.getTime();
  const utc = new Date(asUtc.getTime() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())} ${pad(utc.getUTCHours())}:${pad(utc.getUTCMinutes())}:00`;
}

export async function createSaleAction(formData: FormData) {
  const user = await requireAuth();
  const itemsJson = String(formData.get("itemsJson") ?? "[]");
  const items = JSON.parse(itemsJson);
  const localSoldAt = String(formData.get("soldAt") ?? "").trim() || undefined;
  const soldAt = localSoldAt ? localToUtcSqlite(localSoldAt, user.storeTimezone) : undefined;
  const saleId = await createSale(user.storeId, { items, soldAt }, user.name);
  await logAudit(user.storeId, {
    actorName: user.name,
    action: "sale.created",
    entityType: "sale",
    entityId: saleId,
    detail: `Sale #${saleId}`,
  });
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  revalidatePath("/products");
  redirect(`/sales/${saleId}`);
}

export async function changeUserRoleAction(formData: FormData) {
  const user = await requireAuth();
  if (user.role !== "Owner") throw new Error("Not authorized.");
  const memberId = Number(formData.get("memberId"));
  const newRole = String(formData.get("newRole")) as "Owner" | "Staff";
  const memberName = String(formData.get("memberName") ?? "");
  await changeUserRole(user.storeId, memberId, newRole);
  await logAudit(user.storeId, {
    actorName: user.name,
    action: "user.role_changed",
    entityType: "user",
    entityId: memberId,
    detail: `${memberName} → ${newRole}`,
  });
  revalidatePath("/users");
  redirect("/users");
}

export async function logProofDownloadAction(reservationId: number): Promise<void> {
  const user = await requireAuth();
  await logAudit(user.storeId, {
    actorName: user.name,
    action: "reservation.proof_downloaded",
    entityType: "reservation",
    entityId: reservationId,
    detail: `Reservation #${reservationId}`,
  });
}

export async function updateReservationStatusAction(formData: FormData) {
  const user = await requireAuth();
  const reservationId = Number(formData.get("reservationId"));
  const status = String(formData.get("status")) as ReservationStatus;
  await updateReservationStatus(user.storeId, reservationId, status, user.name);
  await logAudit(user.storeId, {
    actorName: user.name,
    action: "reservation.status_changed",
    entityType: "reservation",
    entityId: reservationId,
    detail: `Reservation #${reservationId} → ${status.replace(/_/g, " ")}`,
  });
  revalidatePath("/reservations");
  revalidatePath(`/reservations/${reservationId}`);
  redirect(`/reservations/${reservationId}`);
}

export async function updateSettingsAction(formData: FormData) {
  const user = await requireAuth();
  const currency = String(formData.get("currency") ?? "USD");
  const timezone = String(formData.get("timezone") ?? "UTC");
  const enabled = formData.get("liveNotifications") === "1";
  await updateStoreCurrency(user.storeId, currency);
  await updateStoreTimezone(user.storeId, timezone);
  await updateLiveNotifications(user.storeId, enabled);
  if (user.role === "Owner") {
    const newName = String(formData.get("storeName") ?? "").trim();
    if (newName.length >= 2) await renameStore(user.storeId, newName);
    const paymentLink = String(formData.get("paymentLink") ?? "").trim() || null;
    await updateStorePaymentLink(user.storeId, paymentLink);
    await logAudit(user.storeId, {
      actorName: user.name,
      action: "settings.payment_link_updated",
      entityType: "settings",
      detail: paymentLink ? `Set to: ${paymentLink}` : "Cleared",
    });
  }
  await logAudit(user.storeId, {
    actorName: user.name,
    action: "settings.updated",
    entityType: "settings",
    detail: `Currency: ${currency} • Timezone: ${timezone}`,
  });
  revalidatePath("/settings");
  redirect("/settings");
}


