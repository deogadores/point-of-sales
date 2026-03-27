"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export function ReserveHeader({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-gray-700/60 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 p-3">
        <div className="flex-1 min-w-0">{left}</div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">{right}</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
