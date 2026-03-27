import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
export { ACTION_LABELS } from "@/lib/audit-labels";

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

export type AuditFilters = {
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
  action?: string;
};

export async function queryAuditLog(storeId: number, filters: AuditFilters = {}, limit = 500) {
  const conditions = [
    eq(auditLog.storeId, storeId),
    ...(filters.start ? [gte(auditLog.createdAt, `${filters.start} 00:00:00`)] : []),
    ...(filters.end   ? [lte(auditLog.createdAt, `${filters.end} 23:59:59`)]   : []),
    ...(filters.action ? [eq(auditLog.action, filters.action)]                 : []),
  ];
  return db
    .select()
    .from(auditLog)
    .where(and(...conditions))
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(limit);
}

