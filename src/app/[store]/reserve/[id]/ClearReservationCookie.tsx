"use client";

import { useEffect } from "react";
import { clearReservationCookieAction } from "@/app/[store]/reserve/actions";

export function ClearReservationCookie({ storeSlug }: { storeSlug: string }) {
  useEffect(() => {
    clearReservationCookieAction(storeSlug);
  }, [storeSlug]);
  return null;
}
