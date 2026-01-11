import Link from "next/link";

export const runtime = "nodejs";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Simple POS</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage products, units, stock, and sales. Track revenue and profits.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            className="rounded-lg border bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="rounded-lg border bg-white px-3 py-2 text-sm font-medium"
            href="/products"
          >
            Products
          </Link>
          <Link
            className="rounded-lg border bg-white px-3 py-2 text-sm font-medium"
            href="/stock"
          >
            Stock
          </Link>
          <Link
            className="rounded-lg border bg-white px-3 py-2 text-sm font-medium"
            href="/sales/new"
          >
            New sale
          </Link>
          <Link
            className="rounded-lg border bg-white px-3 py-2 text-sm font-medium"
            href="/sales"
          >
            Sales query
          </Link>
          <Link
            className="rounded-lg border bg-white px-3 py-2 text-sm font-medium"
            href="/reference/units"
          >
            Reference: Units
          </Link>
        </div>
      </div>
    </main>
  );
}

