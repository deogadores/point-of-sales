import { createUserAction } from "@/app/(pos)/actions";
import { requireAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { listUsersByStore } from "@/lib/auth";

export const runtime = "nodejs";

export default async function UsersPage() {
  const user = await requireAuth();
  const users = await listUsersByStore(user.storeId);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm font-semibold">Users</div>
        <p className="mt-1 text-xs text-slate-500">
          Users belong to a store. Only owners can add users.
        </p>

        {user.role !== "Owner" ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You are signed in as <span className="font-medium">{user.role}</span>. Ask an
            owner to create additional users.
          </div>
        ) : (
          <form action={createUserAction} className="mt-4 grid gap-2 sm:grid-cols-6">
            <label className="sm:col-span-2">
              <div className="text-xs font-medium text-slate-600">Name</div>
              <input name="name" className="field" required />
            </label>
            <label className="sm:col-span-2">
              <div className="text-xs font-medium text-slate-600">Email</div>
              <input name="email" type="email" className="field" required />
            </label>
            <label className="sm:col-span-1">
              <div className="text-xs font-medium text-slate-600">Role</div>
              <select name="role" className="field" defaultValue="Staff">
                <option value="Staff">Staff</option>
                <option value="Owner">Owner</option>
              </select>
            </label>
            <label className="sm:col-span-1">
              <div className="text-xs font-medium text-slate-600">Password</div>
              <input name="password" type="password" className="field" required />
            </label>
            <div className="sm:col-span-6">
              <button className="btn btn-primary w-full sm:w-auto">Create user</button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <div className="text-sm font-semibold">Store users</div>
        {/* Mobile card layout */}
        <div className="mt-3 space-y-2 md:hidden">
          {users.length === 0 ? (
            <div className="py-2 text-sm text-slate-600">No users found.</div>
          ) : (
            users.map((u: any) => (
              <div key={u.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="font-medium">{u.name}</div>
                <div className="mt-1 space-y-1 text-sm text-slate-600">
                  <div>Email: {u.email}</div>
                  <div>Role: {u.role}</div>
                  <div>Created: {formatDate(u.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Desktop table layout */}
        <div className="mt-3 hidden w-full overflow-x-auto no-scrollbar md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="whitespace-nowrap py-2 pr-3">Name</th>
                <th className="whitespace-nowrap py-2 pr-3">Email</th>
                <th className="whitespace-nowrap py-2 pr-3">Role</th>
                <th className="whitespace-nowrap py-2 pr-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className="py-2 text-slate-600" colSpan={4}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 pr-3 font-medium">{u.name}</td>
                    <td className="py-2 pr-3">{u.email}</td>
                    <td className="py-2 pr-3">{u.role}</td>
                    <td className="py-2 pr-3 text-xs text-slate-600">
                      {formatDate(u.created_at)}
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

