"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  created: "Created",
  waiting_for_payment: "Waiting for Payment",
  payment_sent: "Payment Sent",
  payment_confirmed: "Payment Confirmed",
  completed: "Completed"
};

type Toast = { id: number; title: string; body: string; href: string };
let nextId = 0;

export function NotificationWatcher({ enabled }: { enabled: boolean }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, body: string, href: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, title, body, href }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource("/api/reservation-events/stream");

    es.onmessage = (e) => {
      try {
        const data: {
          newReservations: { id: number; customer_name: string }[];
          statusUpdates: { id: number; customer_name: string; status: string }[];
        } = JSON.parse(e.data);

        for (const r of data.newReservations ?? []) {
          addToast("New Reservation", `#${r.id} · ${r.customer_name}`, `/reservations/${r.id}`);
        }
        for (const r of data.statusUpdates ?? []) {
          const label = STATUS_LABELS[r.status] ?? r.status;
          addToast(`Reservation #${r.id} Updated`, `${r.customer_name} → ${label}`, `/reservations/${r.id}`);
        }
      } catch {
        // Malformed message — ignore
      }
    };

    return () => es.close();
  }, [enabled, addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
      {toasts.map((t) => (
        <div key={t.id} className="card shadow-lg border-l-4 border-l-indigo-500 flex items-start gap-3">
          <Link href={t.href} className="flex-1 min-w-0" onClick={() => dismiss(t.id)}>
            <div className="text-xs font-semibold truncate">{t.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.body}</div>
          </Link>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 text-slate-400 hover:text-slate-600 text-xs leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
