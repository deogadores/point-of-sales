"use client";

import { useState } from "react";
import { useActionState } from "react";
import { setupStoreAction, joinStoreAction, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = {};

export function StoreSetupForm() {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [createState, createAction, createPending] = useActionState(setupStoreAction, initialState);
  const [joinState, joinAction, joinPending] = useActionState(joinStoreAction, initialState);

  return (
    <div className="card">
      <div className="text-xl font-semibold tracking-tight">Store setup</div>
      <p className="mt-1 text-sm text-slate-600">
        Create a new store or join an existing one.
      </p>

      <div className="mt-4 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("create")}
          className={[
            "pb-2 text-sm font-medium transition border-b-2 -mb-px",
            tab === "create"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          ].join(" ")}
        >
          Create a store
        </button>
        <button
          type="button"
          onClick={() => setTab("join")}
          className={[
            "pb-2 text-sm font-medium transition border-b-2 -mb-px",
            tab === "join"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          ].join(" ")}
        >
          Join a store
        </button>
      </div>

      {tab === "create" && (
        <div className="mt-4">
          {createState.error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {createState.error}
            </div>
          )}
          <form action={createAction} className="space-y-3">
            <label className="block">
              <div className="text-xs font-medium text-slate-600">Store name</div>
              <input name="storeName" className="field" required />
            </label>
            <button className="btn btn-primary w-full" disabled={createPending}>
              {createPending ? "Creating..." : "Create store"}
            </button>
          </form>
        </div>
      )}

      {tab === "join" && (
        <div className="mt-4">
          {joinState.error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {joinState.error}
            </div>
          )}
          <form action={joinAction} className="space-y-3">
            <label className="block">
              <div className="text-xs font-medium text-slate-600">Invite code</div>
              <input name="inviteCode" className="field" required />
              <div className="mt-1 text-xs text-slate-500">Get this from your store owner.</div>
            </label>
            <button className="btn btn-primary w-full" disabled={joinPending}>
              {joinPending ? "Joining..." : "Join store"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
