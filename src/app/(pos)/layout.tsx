import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/auth/actions";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/stock", label: "Stock" },
  { href: "/sales/new", label: "New sale" },
  { href: "/sales", label: "Sales query" },
  { href: "/reference/units", label: "Units" },
  { href: "/users", label: "Users" }
];

export default async function PosLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 p-3">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Simple POS
          </Link>
          <nav className="-mx-2 flex max-w-[75%] flex-1 gap-1 overflow-x-auto px-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium text-slate-700">{user.storeName}</div>
              <div className="text-[11px] text-slate-500">{user.email}</div>
            </div>
            <form action={logoutAction}>
              <button className="btn btn-ghost px-3 py-2 text-xs">Logout</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-3 sm:p-4">{children}</main>
    </div>
  );
}

