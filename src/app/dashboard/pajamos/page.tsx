import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateTaxes, formatCurrency, TAX_CONSTANTS_2026 } from "@/lib/tax";
import IncomeClient from "./IncomeClient";

const MONTH_NAMES = [
  "Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis",
  "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis",
];

export default async function IncomePage() {
  const session = await getSession();
  if (!session) redirect("/prisijungti");

  const currentYear = new Date().getFullYear();

  const [settingsResult, incomeResult] = await Promise.all([
    query<{
      expense_method: string;
      additional_pension: boolean;
      employed_elsewhere: boolean;
    }>("SELECT * FROM workspace_settings WHERE workspace_id = $1", [session.workspaceId]),
    query<{ id: string; month: number; amount: string; description: string }>(
      "SELECT id, month, amount, description FROM income_records WHERE workspace_id = $1 AND year = $2 ORDER BY month",
      [session.workspaceId, currentYear]
    ),
  ]);

  const settings = settingsResult.rows[0] || {
    expense_method: "30percent",
    additional_pension: false,
    employed_elsewhere: false,
  };

  const incomeRecords: {
    id: string | null;
    month: number;
    monthName: string;
    amount: number;
    description: string;
    runningTotal: number;
    taxes: { gpm: number; vsd: number; psd: number; total: number };
  }[] = [];

  let runningTotal = 0;
  for (let m = 1; m <= 12; m++) {
    const record = incomeResult.rows.find((r) => r.month === m);
    const amount = record ? parseFloat(record.amount) : 0;
    runningTotal += amount;

    const taxResult = calculateTaxes(runningTotal, {
      expenseMethod: settings.expense_method as "30percent" | "actual",
      actualExpenses: 0,
      additionalPension: settings.additional_pension,
      employedElsewhere: settings.employed_elsewhere,
    });

    incomeRecords.push({
      id: record?.id || null,
      month: m,
      monthName: MONTH_NAMES[m - 1],
      amount,
      description: record?.description || "",
      runningTotal,
      taxes: {
        gpm: taxResult.gpm,
        vsd: taxResult.vsd,
        psd: taxResult.psd,
        total: taxResult.totalTax,
      },
    });
  }

  const totalIncome = runningTotal;
  const pvmProgress = Math.min((totalIncome / TAX_CONSTANTS_2026.PVM_THRESHOLD) * 100, 100);
  const isViewer = session.role === "viewer";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Pajamų žurnalas</h1>
        <p className="text-sm text-muted">{currentYear} m. mėnesinės pajamos</p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted">Viso pajamų</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted">Mokesčiai (YTD)</p>
          <p className="mt-1 text-2xl font-bold text-red-accent">
            {formatCurrency(incomeRecords[11].taxes.total)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted">PVM riba</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-bold">{pvmProgress.toFixed(0)}%</p>
            <span className="text-sm text-muted">
              ({formatCurrency(totalIncome)} / {formatCurrency(TAX_CONSTANTS_2026.PVM_THRESHOLD)})
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-border">
            <div
              className={`h-full rounded-full ${
                pvmProgress >= 90 ? "bg-red-accent" : pvmProgress >= 70 ? "bg-yellow-accent" : "bg-emerald-accent"
              }`}
              style={{ width: `${pvmProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Income table (client component for editing) */}
      <IncomeClient
        records={incomeRecords}
        year={currentYear}
        isViewer={isViewer}
      />
    </div>
  );
}
