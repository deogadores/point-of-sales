export function formatMoney(n: number, currency = 'USD') {
  const value = Number.isFinite(n) ? n : 0;
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateString: string | null | undefined, timezone = "UTC"): string {
  if (!dateString) return "";
  // Stored dates have no timezone marker (SQLite datetime('now') → "YYYY-MM-DD HH:MM:SS",
  // custom soldAt → "YYYY-MM-DDTHH:mm"). Both are UTC — append Z so JS parses them correctly.
  const normalized = /Z|[+-]\d{2}:\d{2}$/.test(dateString)
    ? dateString
    : dateString.replace(" ", "T") + "Z";
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return String(dateString);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
