import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth";
import { PosHeader } from "@/app/(pos)/PosHeader";

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
      <PosHeader nav={nav} storeName={user.storeName} email={user.email} />
      <main className="mx-auto max-w-5xl p-3 sm:p-4">{children}</main>
    </div>
  );
}

