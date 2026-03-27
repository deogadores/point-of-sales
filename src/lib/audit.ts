import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export type AuditEntry = {
  actorName?: string;
  action: string;
  entityType?: string;
  entityId?: number;
  detail?: string;
};

export async function logAudit(storeId: number, entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      storeId,
      actorName: entry.actorName ?? null,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      detail: entry.detail ?? null,
    });
  } catch {
    // Audit logging must never break the main operation
  }
}

export async function queryAuditLog(storeId: number, limit = 300) {
  return db
    .select()
    .from(auditLog)
    .where(eq(auditLog.storeId, storeId))
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(limit);
}

export const ACTION_LABELS: Record<string, string> = {
  "user.joined": "User joined",
  "store.created": "Store created",
  "sale.created": "Sale created",
  "product.created": "Product created",
  "unit.created": "Unit created",
  "unit.deleted": "Unit deleted",
  "stock.added": "Stock movement",
  "settings.updated": "Settings updated",
  "reservation.created": "Reservation created",
  "reservation.status_changed": "Reservation status changed",
  "reservation.payment_proof_uploaded": "Payment proof uploaded",
  "reservation.proof_downloaded": "Payment proof downloaded",
  "user.role_changed": "User role changed",
};
