import Link from "next/link";
import type { ReactNode } from "react";

export const runtime = "nodejs";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/stock", label: "Stock" },
  { href: "/sales/new", label: "New sale" },
  { href: "/sales", label: "Sales query" },
  { href: "/reference/units", label: "Units" }
];

export default function PosLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 p-3">
          <Link href="/" className="text-sm font-semibold">
            Simple POS
          </Link>
          <nav className="-mx-2 flex max-w-[75%] flex-1 gap-1 overflow-x-auto px-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-3 sm:p-4">{children}</main>
    </div>
  );
}

