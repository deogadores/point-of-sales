"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ReservationAutoRefresh({ reservationId }: { reservationId: number }) {
  const router = useRouter();

  useEffect(() => {
    const es = new EventSource("/api/reservation-events/stream");

    es.onmessage = (e) => {
      try {
        const data: {
          newReservations: { id: number }[];
          statusUpdates: { id: number }[];
        } = JSON.parse(e.data);

        const affected = [
          ...(data.newReservations ?? []),
          ...(data.statusUpdates ?? []),
        ];

        if (affected.some((r) => r.id === reservationId)) {
          router.refresh();
        }
      } catch {
        // Malformed message — ignore
      }
    };

    return () => es.close();
  }, [reservationId, router]);

  return null;
}
