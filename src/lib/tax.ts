export const TAX_CONSTANTS_2026 = {
  VDU_MONTHLY: 2304.5,
  VDU_ANNUAL: 27654,
  MMA: 1153,
  PVM_THRESHOLD: 45000,
  SODRA_CEILING_VDU: 43,

  GPM_BRACKETS: [
    { upToVDU: 36, rate: 0.2 },
    { upToVDU: 60, rate: 0.25 },
    { upToVDU: Infinity, rate: 0.32 },
  ] as const,

  VSD_RATE: 0.1252,
  VSD_RATE_WITH_PENSION: 0.1552,
  PSD_RATE: 0.0698,
  PSD_MINIMUM_MONTHLY: 80.48,

  EXPENSE_DEDUCTION: 0.3,
  SODRA_BASE_RATE: 0.9,
};

export interface TaxOptions {
  expenseMethod: "30percent" | "actual";
  actualExpenses: number;
  additionalPension: boolean;
  employedElsewhere: boolean;
}

export interface TaxResult {
  income: number;
  expenses: number;
  taxableIncome: number;
  gpm: number;
  vsd: number;
  psd: number;
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
}

export function calculateTaxes(
  annualIncome: number,
  options: TaxOptions
): TaxResult {
  const c = TAX_CONSTANTS_2026;

  // 1. Expenses & taxable income
  const expenses =
    options.expenseMethod === "30percent"
      ? annualIncome * c.EXPENSE_DEDUCTION
      : Math.min(options.actualExpenses || 0, annualIncome);
  const taxableIncome = Math.max(annualIncome - expenses, 0);

  // 2. GPM (progressive brackets)
  const vduAnnual = c.VDU_ANNUAL;
  let gpm = 0;
  let remaining = taxableIncome;
  let prevLimit = 0;

  for (const bracket of c.GPM_BRACKETS) {
    const bracketLimit =
      bracket.upToVDU === Infinity
        ? Infinity
        : bracket.upToVDU * vduAnnual;
    const bracketSize = bracketLimit - prevLimit;
    const taxableInBracket = Math.min(remaining, bracketSize);
    gpm += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    prevLimit = bracketLimit;
    if (remaining <= 0) break;
  }

  // 3. Sodra base (90% of taxable income, capped)
  const sodraCeiling = c.SODRA_CEILING_VDU * vduAnnual;
  const sodraBase = Math.min(taxableIncome * c.SODRA_BASE_RATE, sodraCeiling);

  // 4. VSD
  const vsdRate = options.additionalPension
    ? c.VSD_RATE_WITH_PENSION
    : c.VSD_RATE;
  const vsd = sodraBase * vsdRate;

  // 5. PSD
  const psdMinAnnual = c.PSD_MINIMUM_MONTHLY * 12;
  const psd = options.employedElsewhere
    ? 0
    : Math.max(sodraBase * c.PSD_RATE, psdMinAnnual);

  // 6. Totals
  const totalTax = gpm + vsd + psd;
  const netIncome = annualIncome - totalTax - expenses;
  const effectiveRate =
    annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;

  return {
    income: annualIncome,
    expenses,
    taxableIncome,
    gpm,
    vsd,
    psd,
    totalTax,
    netIncome,
    effectiveRate,
  };
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " \u20AC";
}

export function formatPercent(value: number): string {
  return (
    value.toLocaleString("lt-LT", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "%"
  );
}
