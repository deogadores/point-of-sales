"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ReservationStatusWatcher({
  storeSlug,
  reservationId,
}: {
  storeSlug: string;
  reservationId: number;
  currentStatus: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const url = `/api/reservation-events/customer-stream?storeSlug=${encodeURIComponent(storeSlug)}&id=${reservationId}`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.status) {
          router.refresh();
        }
      } catch {
        // Malformed message — ignore
      }
    };

    return () => es.close();
  }, [storeSlug, reservationId, router]);

  return null;
}
