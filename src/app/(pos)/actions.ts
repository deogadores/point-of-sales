"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addStockMovement,
  createProduct,
  createSale,
  createUnit,
  deleteUnit
} from "@/lib/pos";

export async function createUnitAction(formData: FormData) {
  await createUnit({
    name: String(formData.get("name") ?? ""),
    symbol: String(formData.get("symbol") ?? "")
  });
  revalidatePath("/reference/units");
  redirect("/reference/units");
}

export async function deleteUnitAction(formData: FormData) {
  const unitId = Number(formData.get("unitId"));
  await deleteUnit(unitId);
  revalidatePath("/reference/units");
  redirect("/reference/units");
}

export async function createProductAction(formData: FormData) {
  await createProduct({
    name: String(formData.get("name") ?? ""),
    unitId: formData.get("unitId"),
    unitCostPrice: formData.get("unitCostPrice"),
    unitSalePrice: formData.get("unitSalePrice")
  });
  revalidatePath("/products");
  redirect("/products");
}

export async function addStockMovementAction(formData: FormData) {
  await addStockMovement({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    reason: String(formData.get("reason") ?? "")
  });
  revalidatePath("/stock");
  revalidatePath("/products");
  redirect("/stock");
}

export async function createSaleAction(formData: FormData) {
  const itemsJson = String(formData.get("itemsJson") ?? "[]");
  const items = JSON.parse(itemsJson);
  const saleId = await createSale({ items });
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  revalidatePath("/products");
  redirect(`/sales/${saleId}`);
}

