import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores, reservations } from "@/lib/db/schema";

export const runtime = "nodejs";

const POLL_INTERVAL_MS = 6_000;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const storeSlug = searchParams.get("storeSlug");
  const id = Number(searchParams.get("id"));

  if (!storeSlug || !id) {
    return new Response("Missing params", { status: 400 });
  }

  const [storeRow] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.slug, storeSlug))
    .limit(1);

  if (!storeRow) return new Response("Store not found", { status: 404 });

  const [initial] = await db
    .select({ status: reservations.status })
    .from(reservations)
    .where(and(eq(reservations.storeId, storeRow.id), eq(reservations.id, id)))
    .limit(1);

  if (!initial) return new Response("Reservation not found", { status: 404 });

  const encoder = new TextEncoder();
  let lastStatus = initial.status;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));

      async function poll() {
        try {
          const [row] = await db
            .select({ status: reservations.status })
            .from(reservations)
            .where(and(eq(reservations.storeId, storeRow.id), eq(reservations.id, id)))
            .limit(1);

          if (!row) {
            clearInterval(timer);
            controller.close();
            return;
          }

          if (row.status !== lastStatus) {
            lastStatus = row.status;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: row.status })}\n\n`));
          } else {
            controller.enqueue(encoder.encode(": ping\n\n"));
          }
        } catch {
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
