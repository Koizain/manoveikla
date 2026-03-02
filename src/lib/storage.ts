export const EMPTY_MONTHLY_INCOMES = new Array(12).fill(0);

export function parseMonthlyIncomes(raw: string | null): number[] {
  if (!raw) return [...EMPTY_MONTHLY_INCOMES];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...EMPTY_MONTHLY_INCOMES];

    return Array.from({ length: 12 }, (_, i) => {
      const value = parsed[i];
      return typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, value)
        : 0;
    });
  } catch {
    return [...EMPTY_MONTHLY_INCOMES];
  }
}
