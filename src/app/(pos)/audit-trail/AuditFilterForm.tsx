"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateTimePicker } from "@/app/(pos)/sales/new/DateTimePicker";
import { ACTION_LABELS } from "@/lib/audit-labels";

export function AuditFilterForm({
  start,
  end,
  action,
}: {
  start: string;
  end: string;
  action: string;
}) {
  const router = useRouter();
  const [startVal, setStartVal] = useState(start);
  const [endVal, setEndVal] = useState(end);
  const [actionVal, setActionVal] = useState(action);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (startVal) params.set("start", startVal);
    if (endVal) params.set("end", endVal);
    if (actionVal) params.set("action", actionVal);
    router.push(`/audit-trail?${params.toString()}`);
  }

  function handleReset() {
    router.push("/audit-trail");
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">From</div>
          <DateTimePicker showTime={false} value={startVal} onChange={setStartVal} />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">To</div>
          <DateTimePicker showTime={false} value={endVal} onChange={setEndVal} />
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Action</div>
          <select
            value={actionVal}
            onChange={(e) => setActionVal(e.target.value)}
            className="field"
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" className="btn btn-primary text-xs px-4 py-1.5">
          Filter
        </button>
        <button type="button" onClick={handleReset} className="btn btn-ghost text-xs px-4 py-1.5">
          Reset
        </button>
      </div>
    </form>
  );
}
