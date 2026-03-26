import { NextRequest } from "next/server";
import { and, asc, gt, lte, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";

export const runtime = "nodejs";

const POLL_INTERVAL_MS = 6_000;

function toSqlite(iso: string) {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 19);
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let lastChecked = new Date().toISOString();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive so the browser knows the connection is open
      controller.enqueue(encoder.encode(": connected\n\n"));

      async function poll() {
        const since = lastChecked;
        lastChecked = new Date().toISOString();
        const sinceSqlite = toSqlite(since);

        try {
          const [newReservations, statusUpdates] = await Promise.all([
            db.select({
              id: reservations.id,
              customer_name: reservations.customerName,
            })
            .from(reservations)
            .where(and(eq(reservations.storeId, user.storeId), gt(reservations.createdAt, sinceSqlite)))
            .orderBy(asc(reservations.createdAt)),

            db.select({
              id: reservations.id,
              customer_name: reservations.customerName,
              status: reservations.status,
            })
            .from(reservations)
            .where(and(
              eq(reservations.storeId, user.storeId),
              gt(reservations.updatedAt, sinceSqlite),
              lte(reservations.createdAt, sinceSqlite),
            ))
            .orderBy(asc(reservations.updatedAt)),
          ]);

          if (newReservations.length > 0 || statusUpdates.length > 0) {
            const payload = JSON.stringify({ newReservations, statusUpdates });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          } else {
            // Keepalive comment to prevent proxy timeouts
            controller.enqueue(encoder.encode(": ping\n\n"));
          }
        } catch {
          // DB error — close so client reconnects
          clearInterval(timer);
          controller.close();
        }
      }

      const timer = setInterval(poll, POLL_INTERVAL_MS);

      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
