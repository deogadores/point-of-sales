import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { queryAuditLog, ACTION_LABELS } from "@/lib/audit";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";

const ENTITY_HREF: Record<string, (id: number) => string> = {
  sale: (id) => `/sales/${id}`,
  reservation: (id) => `/reservations/${id}`,
};

export default async function AuditTrailPage() {
  const user = await requireAuth();
  if (user.role !== "Owner") redirect("/dashboard");

  const entries = await queryAuditLog(user.storeId);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm font-semibold">Audit Trail</div>
        <p className="mt-1 text-xs text-slate-500">
          All recorded activity for {user.storeName}. Showing the last {entries.length} entries.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="card text-sm text-slate-500">No activity recorded yet.</div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="space-y-2 md:hidden">
            {entries.map((e) => {
              const label = ACTION_LABELS[e.action] ?? e.action;
              const href = e.entityType && e.entityId ? ENTITY_HREF[e.entityType]?.(e.entityId) : undefined;
              return (
                <div key={e.id} className="card space-y-1 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
                    {href && (
                      <Link href={href} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400 shrink-0">
                        View
                      </Link>
                    )}
                  </div>
                  {e.detail && <div className="text-xs text-slate-500 dark:text-slate-400">{e.detail}</div>}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400 dark:text-slate-500">
                    <span>{e.actorName ?? "Customer"}</span>
                    <span>{formatDate(e.createdAt, user.storeTimezone)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table layout */}
          <div className="hidden w-full overflow-x-auto no-scrollbar md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="whitespace-nowrap py-2 pr-4">Date</th>
                  <th className="whitespace-nowrap py-2 pr-4">Actor</th>
                  <th className="whitespace-nowrap py-2 pr-4">Action</th>
                  <th className="whitespace-nowrap py-2 pr-4">Detail</th>
                  <th className="whitespace-nowrap py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const label = ACTION_LABELS[e.action] ?? e.action;
                  const href = e.entityType && e.entityId ? ENTITY_HREF[e.entityType]?.(e.entityId) : undefined;
                  return (
                    <tr key={e.id} className="border-t dark:border-gray-700">
                      <td className="py-2 pr-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(e.createdAt, user.storeTimezone)}
                      </td>
                      <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                        {e.actorName ?? <span className="text-slate-400 italic">Customer</span>}
                      </td>
                      <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {label}
                      </td>
                      <td className="py-2 pr-4 text-xs text-slate-500 dark:text-slate-400">
                        {e.detail ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {href && (
                          <Link href={href} className="btn btn-ghost px-3 py-1.5 text-xs">
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
