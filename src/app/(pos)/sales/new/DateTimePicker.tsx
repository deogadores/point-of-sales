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
        className="z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg p-3 space-y-3"
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
            caption_label: "text-sm font-semibold text-slate-800",
            nav: "flex items-center gap-1",
            button_previous:
              "p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition",
            button_next:
              "p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition",
            weeks: "space-y-0.5",
            weekdays: "flex",
            weekday: "w-9 text-center text-xs text-slate-400 font-medium py-1",
            week: "flex",
            day: "w-9 h-9 flex items-center justify-center rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition cursor-pointer",
            day_button: "w-full h-full flex items-center justify-center rounded-lg",
            selected: "!bg-indigo-600 !text-white font-semibold hover:!bg-indigo-700",
            today: "font-semibold text-indigo-600",
            outside: "text-slate-300",
            disabled: "opacity-40 cursor-not-allowed",
          }}
        />

        {showTime && (
          <div className="border-t border-slate-100 pt-3">
            <label className="text-xs font-medium text-slate-600">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="field mt-1 w-full"
            />
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
}
