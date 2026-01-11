import Link from "next/link";
import { SaleForm } from "@/app/(pos)/sales/new/SaleForm";
import { listProductsWithStock } from "@/lib/pos";

export const runtime = "nodejs";

export default async function NewSalePage() {
  const products = await listProductsWithStock();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">New sale</div>
            <p className="mt-1 text-xs text-slate-500">
              Saving a sale automatically decreases stock and records profit.
            </p>
          </div>
          <Link
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
            href="/sales"
          >
            Go to sales query
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
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

