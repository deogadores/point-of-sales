"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState);

  if (state?.success) {
    return (
      <div className="card">
        <div className="text-xl font-semibold tracking-tight">Check your email</div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          If an account exists for that email, we've sent a password reset link. Check your inbox.
        </p>
        <div className="mt-4">
          <Link className="btn btn-ghost w-full" href="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="text-xl font-semibold tracking-tight">Forgot password</div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Enter your email and we'll send you a reset link.
      </p>

      {state?.error ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400">
          {state.error}
        </div>
      ) : null}

      <form action={action} className="mt-4 space-y-3">
        <label className="block">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</div>
          <input name="email" type="email" className="field" required />
        </label>

        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        <Link className="underline" href="/login">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
