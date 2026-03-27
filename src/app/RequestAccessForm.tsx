"use client";

import { useState } from "react";
import { requestAccessAction } from "@/app/auth/actions";

export function RequestAccessForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await requestAccessAction(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
    }
    setPending(false);
  }

  if (submitted) {
    return (
      <div className="card text-center py-8">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Request submitted!</div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          We&apos;ll review your request and send a registration phrase to your email if approved.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="btn btn-ghost mt-4 text-xs"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400">
          {error}
        </div>
      )}

      <label className="block">
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Full name</div>
        <input name="name" className="field" placeholder="Jane Doe" required />
      </label>

      <label className="block">
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</div>
        <input name="email" type="email" className="field" placeholder="jane@example.com" required />
      </label>

      <label className="block">
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Reason <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span></div>
        <textarea
          name="reason"
          className="field resize-none"
          rows={3}
          placeholder="Briefly describe why you need access..."
        />
      </label>

      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Submitting..." : "Request access"}
      </button>
    </form>
  );
}
