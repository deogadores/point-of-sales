"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createUserInStore } from "@/lib/auth";
import {
  addStockMovement,
  createProduct,
  createSale,
  createUnit,
  deleteUnit
} from "@/lib/pos";

export async function createUnitAction(formData: FormData) {
  await requireAuth();
  await createUnit({
    name: String(formData.get("name") ?? ""),
    symbol: String(formData.get("symbol") ?? "")
  });
  revalidatePath("/reference/units");
  redirect("/reference/units");
}

export async function deleteUnitAction(formData: FormData) {
  await requireAuth();
  const unitId = Number(formData.get("unitId"));
  await deleteUnit(unitId);
  revalidatePath("/reference/units");
  redirect("/reference/units");
}

export async function createProductAction(formData: FormData) {
  const user = await requireAuth();
  await createProduct(user.storeId, {
    name: String(formData.get("name") ?? ""),
    unitId: formData.get("unitId"),
    unitCostPrice: formData.get("unitCostPrice"),
    unitSalePrice: formData.get("unitSalePrice")
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
  const saleId = await createSale(user.storeId, { items });
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  revalidatePath("/products");
  redirect(`/sales/${saleId}`);
}

export async function createUserAction(formData: FormData) {
  const user = await requireAuth();
  if (user.role !== "Owner") {
    throw new Error("Only store owners can create users.");
  }

  await createUserInStore(user.storeId, {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "Staff")
  });

  revalidatePath("/users");
  redirect("/users");
}

