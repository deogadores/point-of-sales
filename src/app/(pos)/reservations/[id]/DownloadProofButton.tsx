"use client";

import { logProofDownloadAction } from "@/app/(pos)/actions";

export function DownloadProofButton({
  reservationId,
  mime,
  base64,
}: {
  reservationId: number;
  mime: string;
  base64: string;
}) {
  const ext = mime === "image/png" ? "png" : "jpg";
  const filename = `payment-proof-${reservationId}.${ext}`;

  async function handleClick() {
    // Log first (fire-and-forget — don't block the download)
    logProofDownloadAction(reservationId).catch(() => {});

    // Trigger download
    const a = document.createElement("a");
    a.href = `data:${mime};base64,${base64}`;
    a.download = filename;
    a.click();
  }

  return (
    <button type="button" onClick={handleClick} className="btn btn-ghost text-xs">
      Download
    </button>
  );
}
