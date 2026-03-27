"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { registerAction, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);
  const searchParams = useSearchParams();
  const phraseFromUrl = searchParams.get("phrase") || "";
  const emailFromUrl = searchParams.get("email") || "";

  return (
    <div className="card">
      <div className="text-xl font-semibold tracking-tight">Create an account</div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        You need a registration phrase to sign up. After registering you can create or join a store.
      </p>

      {state.error ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400">
          {state.error}
        </div>
      ) : null}

      <form action={action} className="mt-4 space-y-3">
        <label className="block">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Registration phrase</div>
          <input
            name="registrationPhrase"
            className={`field ${phraseFromUrl ? "cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-gray-700 dark:text-slate-400" : ""}`}
            defaultValue={phraseFromUrl}
            readOnly={!!phraseFromUrl}
            required
          />
          {!phraseFromUrl && (
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Provided by your administrator.</div>
          )}
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Your name</div>
          <input name="name" className="field" required />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</div>
          <input
            name="email"
            type="email"
            className={`field ${emailFromUrl ? "cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-gray-700 dark:text-slate-400" : ""}`}
            defaultValue={emailFromUrl}
            readOnly={!!emailFromUrl}
            required
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Password</div>
          <input name="password" type="password" className="field" required />
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Minimum 8 characters.</div>
        </label>

        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link className="underline" href="/login">
          Login
        </Link>
        .
      </p>
    </div>
  );
}
