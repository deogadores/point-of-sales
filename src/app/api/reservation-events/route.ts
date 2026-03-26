import { NextRequest, NextResponse } from "next/server";
import { and, asc, gt, lte, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = req.nextUrl.searchParams.get("since");
  if (!since) return NextResponse.json({ error: "Missing since" }, { status: 400 });

  // Convert ISO 8601 → SQLite datetime format ("YYYY-MM-DD HH:MM:SS") for correct string comparison.
  const sinceDate = new Date(since);
  if (isNaN(sinceDate.getTime())) return NextResponse.json({ error: "Invalid since" }, { status: 400 });
  const sinceSqlite = sinceDate.toISOString().replace("T", " ").slice(0, 19);

  // New reservations created after `since`.
  const newReservations = await db
    .select({
      id: reservations.id,
      customer_name: reservations.customerName,
      status: reservations.status,
      created_at: reservations.createdAt,
    })
    .from(reservations)
    .where(and(eq(reservations.storeId, user.storeId), gt(reservations.createdAt, sinceSqlite)))
    .orderBy(asc(reservations.createdAt));

  // Reservations whose status changed after `since` (exclude brand-new ones above).
  const statusUpdates = await db
    .select({
      id: reservations.id,
      customer_name: reservations.customerName,
      status: reservations.status,
      updated_at: reservations.updatedAt,
    })
    .from(reservations)
    .where(and(
      eq(reservations.storeId, user.storeId),
      gt(reservations.updatedAt, sinceSqlite),
      lte(reservations.createdAt, sinceSqlite)
    ))
    .orderBy(asc(reservations.updatedAt));

  return NextResponse.json({ newReservations, statusUpdates });
}
