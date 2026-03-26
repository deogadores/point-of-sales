"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth, updateStoreCurrency, updateLiveNotifications } from "@/lib/auth";
import {
  addStockMovement,
  createProduct,
  createSale,
  createUnit,
  deleteUnit
} from "@/lib/pos";
import { updateReservationStatus, type ReservationStatus } from "@/lib/reservations";

export async function createUnitAction(formData: FormData) {
  const user = await requireAuth();
  await createUnit(user.storeId, {
    name: String(formData.get("name") ?? ""),
    symbol: String(formData.get("symbol") ?? "")
  });
  revalidatePath("/reference/units");
  redirect("/reference/units");
}

export async function deleteUnitAction(formData: FormData) {
  const user = await requireAuth();
  const unitId = Number(formData.get("unitId"));
  await deleteUnit(user.storeId, unitId);
  revalidatePath("/reference/units");
  redirect("/reference/units");
}

export async function createProductAction(formData: FormData) {
  const user = await requireAuth();
  await createProduct(user.storeId, {
    name: String(formData.get("name") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    unitId: formData.get("unitId"),
    unitCostPrice: formData.get("unitCostPrice"),
    unitSalePrice: formData.get("unitSalePrice"),
    initialStock: formData.get("initialStock"),
  });
  revalidatePath("/products");
  redirect("/products");
}

export async function addStockMovementAction(formData: FormData) {
  const user = await requireAuth();
  await addStockMovement(user.storeId, {
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    reason: String(formData.get("reason") ?? "")
  });
  revalidatePath("/stock");
  revalidatePath("/products");
  redirect("/stock");
}

export async function createSaleAction(formData: FormData) {
  const user = await requireAuth();
  const itemsJson = String(formData.get("itemsJson") ?? "[]");
  const items = JSON.parse(itemsJson);
  const soldAt = String(formData.get("soldAt") ?? "").trim() || undefined;
  const saleId = await createSale(user.storeId, { items, soldAt });
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  revalidatePath("/products");
  redirect(`/sales/${saleId}`);
}

export async function updateReservationStatusAction(formData: FormData) {
  const user = await requireAuth();
  const reservationId = Number(formData.get("reservationId"));
  const status = String(formData.get("status")) as ReservationStatus;
  await updateReservationStatus(user.storeId, reservationId, status);
  revalidatePath("/reservations");
  revalidatePath(`/reservations/${reservationId}`);
  redirect(`/reservations/${reservationId}`);
}

export async function updateSettingsAction(formData: FormData) {
  const user = await requireAuth();
  const currency = String(formData.get("currency") ?? "USD");
  const enabled = formData.get("liveNotifications") === "1";
  await updateStoreCurrency(user.storeId, currency);
  await updateLiveNotifications(user.storeId, enabled);
  revalidatePath("/settings");
  redirect("/settings");
}


