import { createUnitAction, deleteUnitAction } from "@/app/(pos)/actions";
import { listUnits } from "@/lib/pos";

export const runtime = "nodejs";

export default async function UnitsPage() {
  const units = await listUnits();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Units of measurement</div>
        <p className="mt-1 text-xs text-slate-500">
          This is a reference table used by products (e.g. pc, kg, L).
        </p>

        <form action={createUnitAction} className="mt-4 grid gap-2 sm:grid-cols-5">
          <label className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-600">Name</div>
            <input
              name="name"
              placeholder="e.g. Piece"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-600">Symbol</div>
            <input
              name="symbol"
              placeholder="e.g. pc"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-1 sm:flex sm:items-end">
            <button className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
              Add
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Existing units</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Symbol</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-2 text-slate-600">
                    No units yet.
                  </td>
                </tr>
              ) : (
                units.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 pr-3 font-medium">{u.name}</td>
                    <td className="py-2 pr-3">{u.symbol ?? ""}</td>
                    <td className="py-2 pr-3">
                      <form action={deleteUnitAction}>
                        <input type="hidden" name="unitId" value={u.id} />
                        <button className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

