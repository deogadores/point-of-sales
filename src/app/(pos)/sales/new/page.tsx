import Link from "next/link";
import { SaleForm } from "@/app/(pos)/sales/new/SaleForm";
import { requireAuth } from "@/lib/auth";
import { listProductsWithStock } from "@/lib/pos";

export const runtime = "nodejs";

export default async function NewSalePage() {
  const user = await requireAuth();
  const products = await listProductsWithStock(user.storeId);

  // Serialize products to plain objects to avoid serialization errors
  const serializedProducts = products.map((p) => ({
    id: Number(p.id),
    name: String(p.name),
    unit_cost_price: Number(p.unit_cost_price),
    unit_sale_price: Number(p.unit_sale_price),
    unit_symbol: p.unit_symbol ? String(p.unit_symbol) : null,
    stock_qty: Number(p.stock_qty)
  }));

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">New sale</div>
            <p className="mt-1 text-xs text-slate-500">
              Saving a sale automatically decreases stock and records profit.
            </p>
          </div>
          <Link
            className="btn btn-ghost"
            href="/sales"
          >
            Go to sales query
          </Link>
        </div>
      </div>

      <div className="card">
        {serializedProducts.length === 0 ? (
          <div className="text-sm text-slate-700">
            Add a product first, then come back here to record sales.
          </div>
        ) : (
          <SaleForm products={serializedProducts} currency={user.storeCurrency} />
        )}
      </div>
    </div>
  );
}

