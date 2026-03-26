import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth";
import { PosHeader } from "@/app/(pos)/PosHeader";
import { NotificationWatcher } from "@/app/(pos)/NotificationWatcher";

export const runtime = "nodejs";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/sales/new", label: "New sale" },
  { href: "/sales", label: "Sales query" },
  { href: "/reservations", label: "Reservations" },
  {
    label: "Manage",
    children: [
      { href: "/stock", label: "Stock" },
      { href: "/reference/units", label: "Units" },
      { href: "/users", label: "Users" },
      { href: "/settings", label: "Settings" }
    ]
  }
];

export default async function PosLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen">
      <NotificationWatcher enabled={user.liveNotifications} />
      <PosHeader nav={nav} storeName={user.storeName} email={user.email} />
      <main className="mx-auto max-w-5xl p-3 sm:p-4">{children}</main>
    </div>
  );
}

