"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <div className="card">
      <div className="text-xl font-semibold tracking-tight">Login</div>
      <p className="mt-1 text-sm text-slate-600">Sign in to your store.</p>

      {state.error ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <form action={action} className="mt-4 space-y-3">
        <label className="block">
          <div className="text-xs font-medium text-slate-600">Email</div>
          <input name="email" type="email" className="field" required />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-600">Password</div>
          <input name="password" type="password" className="field" required />
        </label>

        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        New here?{" "}
        <Link className="underline" href="/register">
          Create a store
        </Link>
        .
      </p>
    </div>
  );
}

