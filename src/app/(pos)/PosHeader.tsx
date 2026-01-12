"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const items = useMemo(() => nav, [nav]);

  // Check if pathname matches any nav item exactly
  const exactMatchHref = useMemo(() => {
    return items.find((item) => pathname === item.href)?.href;
  }, [items, pathname]);

  function linkClass(href: string) {
    const exactMatch = pathname === href;
    // Only use prefix matching if there's no exact match for this pathname
    // and if this href is a parent of the pathname
    const prefixMatch =
      !exactMatchHref &&
      href !== "/" &&
      pathname?.startsWith(href + "/");
    const active = exactMatch || prefixMatch;
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

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 flex-wrap items-center gap-1 px-2 md:flex">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden text-right md:block">
            <div className="text-xs font-medium text-slate-700">{storeName}</div>
            <div className="text-[11px] text-slate-500">{email}</div>
          </div>

          <form action={logoutAction} className="hidden md:block">
            <button className="btn btn-ghost px-3 py-2 text-xs">Logout</button>
          </form>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="btn btn-ghost px-3 py-2 text-xs md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Mobile Menu Dialog */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="relative z-50 md:hidden">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

        {/* Dialog Panel */}
        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-4 sm:max-w-sm sm:ring-1 sm:ring-slate-200">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="text-sm font-semibold">{storeName}</div>
                <div className="text-xs text-slate-500">{email}</div>
              </div>
              <button
                type="button"
                className="btn btn-ghost px-3 py-2 text-xs"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                Close
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="grid gap-1">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={linkClass(item.href)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-4">
              <form action={logoutAction}>
                <button className="btn btn-primary w-full">Logout</button>
              </form>
            </div>
          </div>
        </div>
      </Dialog>
    </header>
  );
}

