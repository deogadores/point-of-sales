import { requireAuth, listUsersByStore, getStoreInviteCode } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";

export default async function UsersPage() {
  const user = await requireAuth();
  const [members, inviteCode] = await Promise.all([
    listUsersByStore(user.storeId),
    user.role === "Owner" ? getStoreInviteCode(user.storeId) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm font-semibold">Users</div>
        <p className="mt-1 text-xs text-slate-500">
          Members of this store. Staff can join using the invite code below.
        </p>

        {user.role === "Owner" && inviteCode ? (
          <div className="mt-4 space-y-1">
            <div className="text-xs font-medium text-slate-600">Store invite code</div>
            <div className="flex items-center gap-2">
              <code className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-mono tracking-wide select-all">
                {inviteCode}
              </code>
            </div>
            <p className="text-xs text-slate-500">
              Share this with staff. They register at <strong>/register</strong> then use this code at <strong>/store-setup</strong> to join.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You are signed in as <span className="font-medium">{user.role}</span>. Only owners can see the invite code.
          </div>
        )}
      </div>

      <div className="card">
        <div className="text-sm font-semibold">Store members</div>
        {/* Mobile card layout */}
        <div className="mt-3 space-y-2 md:hidden">
          {members.length === 0 ? (
            <div className="py-2 text-sm text-slate-600">No members found.</div>
          ) : (
            members.map((m: any) => (
              <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="font-medium">{m.name}</div>
                <div className="mt-1 space-y-1 text-sm text-slate-600">
                  <div>Email: {m.email}</div>
                  <div>Role: {m.role}</div>
                  <div>Joined: {formatDate(m.joined_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Desktop table layout */}
        <div className="mt-3 hidden w-full overflow-x-auto no-scrollbar md:block">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="whitespace-nowrap py-2 pr-3">Name</th>
                <th className="whitespace-nowrap py-2 pr-3">Email</th>
                <th className="whitespace-nowrap py-2 pr-3">Role</th>
                <th className="whitespace-nowrap py-2 pr-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td className="py-2 text-slate-600" colSpan={4}>
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((m: any) => (
                  <tr key={m.id} className="border-t">
                    <td className="py-2 pr-3 font-medium">{m.name}</td>
                    <td className="py-2 pr-3">{m.email}</td>
                    <td className="py-2 pr-3">{m.role}</td>
                    <td className="py-2 pr-3 text-xs text-slate-600">
                      {formatDate(m.joined_at)}
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
