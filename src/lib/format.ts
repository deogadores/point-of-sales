export function formatMoney(n: number) {
  const value = Number.isFinite(n) ? n : 0;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

