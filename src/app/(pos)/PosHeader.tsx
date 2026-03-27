"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Dialog, Menu } from "@headlessui/react";
import { logoutAction } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";

type ChildNavItem = { href: string; label: string };
type NavItem =
  | { href: string; label: string; children?: never }
  | { href?: never; label: string; children: ChildNavItem[] };

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

  const allLeafHrefs = useMemo(
    () => items.flatMap((item) => (item.children ? item.children.map((c) => c.href) : [item.href!])),
    [items]
  );

  const exactMatchHref = useMemo(() => {
    return allLeafHrefs.find((href) => pathname === href);
  }, [allLeafHrefs, pathname]);

  function linkClass(href: string) {
    const exactMatch = pathname === href;
    const prefixMatch = !exactMatchHref && href !== "/" && pathname?.startsWith(href + "/");
    const active = exactMatch || prefixMatch;
    return [
      "rounded-xl px-3 py-2 text-sm transition",
      active
        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800"
    ].join(" ");
  }

  function isGroupActive(children: ChildNavItem[]) {
    return children.some((child) => {
      const exactMatch = pathname === child.href;
      const prefixMatch =
        !exactMatchHref && child.href !== "/" && pathname?.startsWith(child.href + "/");
      return exactMatch || prefixMatch;
    });
  }

  return (
    <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-gray-700/60 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 p-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Simple POS
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 flex-wrap items-center gap-1 px-2 md:flex">
          {items.map((item) =>
            item.children ? (
              <Menu as="div" key={item.label} className="relative">
                <Menu.Button
                  className={[
                    "flex items-center gap-1 rounded-xl px-3 py-2 text-sm transition",
                    isGroupActive(item.children)
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800"
                  ].join(" ")}
                >
                  {item.label}
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <path d="M6 8L1 3h10z" />
                  </svg>
                </Menu.Button>
                <Menu.Items className="absolute left-0 top-full z-10 mt-1 min-w-[120px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg focus:outline-none dark:border-gray-700 dark:bg-gray-900">
                  {item.children.map((child) => (
                    <Menu.Item key={child.href}>
                      {({ active }) => (
                        <Link
                          href={child.href}
                          className={[
                            "block px-3 py-2 text-sm",
                            active ? "bg-slate-50 dark:bg-gray-800" : "",
                            pathname === child.href
                              ? "font-medium text-indigo-700 dark:text-indigo-300"
                              : "text-slate-700 dark:text-slate-300"
                          ].join(" ")}
                        >
                          {child.label}
                        </Link>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Menu>
            ) : (
              <Link key={item.href} href={item.href!} className={linkClass(item.href!)}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden text-right md:block">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{storeName}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{email}</div>
          </div>

          <ThemeToggle />

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
        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-4 sm:max-w-sm sm:ring-1 sm:ring-slate-200 dark:bg-gray-900 dark:sm:ring-gray-700">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-gray-700">
              <div>
                <div className="text-sm font-semibold">{storeName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{email}</div>
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
                {items.map((item) =>
                  item.children ? (
                    <div key={item.label}>
                      <div
                        className={[
                          "px-3 py-2 text-xs font-semibold uppercase tracking-wide",
                          isGroupActive(item.children)
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400 dark:text-slate-500"
                        ].join(" ")}
                      >
                        {item.label}
                      </div>
                      <div className="ml-2 grid gap-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={linkClass(child.href)}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href!}
                      className={linkClass(item.href!)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-4 dark:border-gray-700">
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
