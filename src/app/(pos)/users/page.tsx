import { requireAuth, listUsersByStore, getStoreInviteCode } from "@/lib/auth";
import { changeUserRoleAction } from "@/app/(pos)/actions";
import { formatDate } from "@/lib/format";
import { CopyButton } from "./CopyButton";

export const runtime = "nodejs";

export default async function UsersPage() {
  const user = await requireAuth();
  const [members, inviteCode] = await Promise.all([
    listUsersByStore(user.storeId),
    user.role === "Owner" ? getStoreInviteCode(user.storeId) : Promise.resolve(null),
  ]);

  const isOwner = user.role === "Owner";

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="text-sm font-semibold">Users</div>
        <p className="mt-1 text-xs text-slate-500">
          Members of this store. Staff can join using the invite code below.
        </p>

        {isOwner && inviteCode ? (
          <div className="mt-4 space-y-1">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Store invite code</div>
            <div className="flex items-center gap-2">
              <code className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-mono tracking-wide select-all dark:border-gray-700 dark:bg-gray-800">
                {inviteCode}
              </code>
              <CopyButton text={inviteCode} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share this with staff. They register at <strong>/register</strong> then use this code at <strong>/store-setup</strong> to join.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400">
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
            members.map((m: any) => {
              const isFounder = m.isFounder === true;
              const isSelf = m.id === user.memberId;
              const canChangeRole = isOwner && !isFounder && !isSelf;
              const newRole = m.role === "Owner" ? "Staff" : "Owner";
              return (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {m.name}
                        {isFounder && (
                          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            Founder
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5 text-sm text-slate-600 dark:text-slate-400">
                        <div>Email: {m.email}</div>
                        <div>Role: {m.role}</div>
                        <div>Joined: {formatDate(m.joined_at, user.storeTimezone)}</div>
                      </div>
                    </div>
                    {canChangeRole && (
                      <form action={changeUserRoleAction}>
                        <input type="hidden" name="memberId" value={m.id} />
                        <input type="hidden" name="newRole" value={newRole} />
                        <input type="hidden" name="memberName" value={m.name} />
                        <button
                          type="submit"
                          className="btn btn-ghost px-3 py-1.5 text-xs whitespace-nowrap"
                        >
                          Make {newRole}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop table layout */}
        <div className="mt-3 hidden w-full overflow-x-auto no-scrollbar md:block">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="whitespace-nowrap py-2 pr-3">Name</th>
                <th className="whitespace-nowrap py-2 pr-3">Email</th>
                <th className="whitespace-nowrap py-2 pr-3">Role</th>
                <th className="whitespace-nowrap py-2 pr-3">Joined</th>
                {isOwner && <th className="whitespace-nowrap py-2 pr-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td className="py-2 text-slate-600" colSpan={isOwner ? 5 : 4}>
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((m: any) => {
                  const isFounder = m.isFounder === true;
                  const isSelf = m.id === user.memberId;
                  const canChangeRole = isOwner && !isFounder && !isSelf;
                  const newRole = m.role === "Owner" ? "Staff" : "Owner";
                  return (
                    <tr key={m.id} className="border-t dark:border-gray-700">
                      <td className="py-2 pr-3 font-medium">
                        {m.name}
                        {isFounder && (
                          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            Founder
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">{m.email}</td>
                      <td className="py-2 pr-3">{m.role}</td>
                      <td className="py-2 pr-3 text-xs text-slate-600 dark:text-slate-400">
                        {formatDate(m.joined_at, user.storeTimezone)}
                      </td>
                      {isOwner && (
                        <td className="py-2 pr-3">
                          {canChangeRole ? (
                            <form action={changeUserRoleAction}>
                              <input type="hidden" name="memberId" value={m.id} />
                              <input type="hidden" name="newRole" value={newRole} />
                              <input type="hidden" name="memberName" value={m.name} />
                              <button type="submit" className="btn btn-ghost px-3 py-1.5 text-xs">
                                Make {newRole}
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {isFounder ? "Founder — protected" : "You"}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
