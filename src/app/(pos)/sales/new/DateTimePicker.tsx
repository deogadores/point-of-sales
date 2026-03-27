"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import "react-day-picker/style.css";

function formatDisplay(date: Date, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toIsoLocal(date: Date, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  // Return local datetime string that the server action expects
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowTime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")); // 01–12
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));     // 00–59

function TimeSelect({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  // value is 24h "HH:mm"
  const [rawH, rawM] = value.split(":").map(Number);
  const ampm   = rawH < 12 ? "AM" : "PM";
  const hour12 = String(rawH % 12 || 12).padStart(2, "0");
  const minute = String(rawM).padStart(2, "0");

  function emit(h12: string, m: string, period: string) {
    let h24 = Number(h12) % 12;
    if (period === "PM") h24 += 12;
    onChange(`${String(h24).padStart(2, "0")}:${m}`);
  }

  const sel = "field py-1 px-2 text-sm w-full";

  return (
    <div className="flex items-center gap-1">
      <select className={sel} value={hour12} onChange={(e) => emit(e.target.value, minute, ampm)}>
        {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="text-slate-400 dark:text-slate-500 font-medium">:</span>
      <select className={sel} value={minute} onChange={(e) => emit(hour12, e.target.value, ampm)}>
        {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select className={sel} value={ampm} onChange={(e) => emit(hour12, minute, e.target.value)}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export function DateTimePicker({
  value,
  onChange,
  showTime = true,
}: {
  value: string; // "YYYY-MM-DDTHH:mm" when showTime=true, "YYYY-MM-DD" when false
  onChange: (value: string) => void;
  showTime?: boolean;
}) {
  const initial = value ? new Date(value) : new Date();
  const [selected, setSelected] = useState<Date>(initial);
  const [time, setTime] = useState<string>(
    value && showTime ? value.slice(11, 16) : nowTime()
  );

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    setSelected(day);
    if (showTime) {
      onChange(toIsoLocal(day, time));
    } else {
      const pad = (n: number) => String(n).padStart(2, "0");
      onChange(`${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`);
    }
  }

  function handleTimeChange(t: string) {
    setTime(t);
    onChange(toIsoLocal(selected, t));
  }

  const displayLabel = showTime
    ? formatDisplay(selected, time)
    : selected.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <Popover className="relative">
      <PopoverButton className="field flex items-center gap-2 text-left text-sm w-auto min-w-48">
        <span className="text-slate-400 text-xs">📅</span>
        {displayLabel}
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        className="z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg p-3 space-y-3 dark:border-gray-700 dark:bg-gray-900"
      >
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleDaySelect}
          defaultMonth={selected}
          classNames={{
            root: "text-sm",
            months: "flex flex-col",
            month: "space-y-2",
            month_caption: "flex justify-between items-center px-1 py-1",
            caption_label: "text-sm font-semibold text-slate-800 dark:text-slate-200",
            nav: "flex items-center gap-1",
            button_previous:
              "p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition dark:hover:bg-gray-800 dark:text-slate-400 dark:hover:text-slate-200",
            button_next:
              "p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition dark:hover:bg-gray-800 dark:text-slate-400 dark:hover:text-slate-200",
            weeks: "space-y-0.5",
            weekdays: "flex",
            weekday: "w-9 text-center text-xs text-slate-400 font-medium py-1 dark:text-slate-500",
            week: "flex",
            day: "w-9 h-9 flex items-center justify-center rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition cursor-pointer dark:text-slate-300 dark:hover:bg-gray-800",
            day_button: "w-full h-full flex items-center justify-center rounded-lg",
            selected: "!bg-indigo-600 !text-white font-semibold hover:!bg-indigo-700",
            today: "font-semibold text-indigo-600 dark:text-indigo-400",
            outside: "text-slate-300 dark:text-slate-600",
            disabled: "opacity-40 cursor-not-allowed",
          }}
        />

        {showTime && (
          <div className="border-t border-slate-100 pt-3 dark:border-gray-700">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Time</div>
            <TimeSelect value={time} onChange={handleTimeChange} />
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
}
