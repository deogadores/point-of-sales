import Link from "next/link";
import { SaleForm } from "@/app/(pos)/sales/new/SaleForm";
import { requireAuth } from "@/lib/auth";
import { listProductsWithStock } from "@/lib/pos";

export const runtime = "nodejs";

export default async function NewSalePage() {
  const user = await requireAuth();
  const products = await listProductsWithStock(user.storeId);

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
        {products.length === 0 ? (
          <div className="text-sm text-slate-700">
            Add a product first, then come back here to record sales.
          </div>
        ) : (
          <SaleForm products={products as any} />
        )}
      </div>
    </div>
  );
}

