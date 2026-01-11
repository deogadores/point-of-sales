"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { logoutAction } from "@/app/auth/actions";

type NavItem = { href: string; label: string };

export function PosHeader({
  nav,
  storeName,
  email
}: {
  nav: NavItem[];
  storeName: string;
  email: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = useMemo(() => nav, [nav]);

  function linkClass(href: string) {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return [
      "rounded-xl px-3 py-2 text-sm transition",
      active ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"
    ].join(" ");
  }

  return (
    <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 p-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Simple POS
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 flex-wrap items-center gap-1 px-2 sm:flex">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <div className="text-xs font-medium text-slate-700">{storeName}</div>
            <div className="text-[11px] text-slate-500">{email}</div>
          </div>

          <form action={logoutAction} className="hidden sm:block">
            <button className="btn btn-ghost px-3 py-2 text-xs">Logout</button>
          </form>

          {/* Mobile burger */}
          <button
            type="button"
            className="btn btn-ghost px-3 py-2 text-xs sm:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/30"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] border-l bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{storeName}</div>
                <div className="text-xs text-slate-500">{email}</div>
              </div>
              <button
                type="button"
                className="btn btn-ghost px-3 py-2 text-xs"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(item.href)}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 border-t pt-4">
              <form action={logoutAction}>
                <button className="btn btn-primary w-full">Logout</button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

