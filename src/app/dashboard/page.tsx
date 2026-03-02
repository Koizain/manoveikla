import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { calculateTaxes, formatCurrency, TAX_CONSTANTS_2026 } from "@/lib/tax";
import Link from "next/link";

const MONTH_NAMES = [
  "Sau", "Vas", "Kov", "Bal", "Geg", "Bir",
  "Lie", "Rgp", "Rgs", "Spa", "Lap", "Grd",
];

function getNextDeadline(): { label: string; date: Date; description: string } {
  const now = new Date();
  const year = now.getFullYear();

  const deadlines = [
    { label: "GPM avansas", date: new Date(year, 2, 15), description: "I ketv. GPM avansinis mokėjimas" },
    { label: "Sodra", date: new Date(year, now.getMonth(), 15), description: "Mėnesinis VSD/PSD mokėjimas" },
    { label: "GPM avansas", date: new Date(year, 5, 15), description: "II ketv. GPM avansinis mokėjimas" },
    { label: "GPM avansas", date: new Date(year, 8, 15), description: "III ketv. GPM avansinis mokėjimas" },
    { label: "Metinė deklaracija", date: new Date(year, 4, 1), description: "Metinė pajamų deklaracija" },
    { label: "GPM avansas", date: new Date(year, 11, 15), description: "IV ketv. GPM avansinis mokėjimas" },
  ];

  // Also add next month's Sodra
  const nextMonth = now.getMonth() + 1;
  deadlines.push({
    label: "Sodra",
    date: new Date(nextMonth > 11 ? year + 1 : year, nextMonth > 11 ? 0 : nextMonth, 15),
    description: "Mėnesinis VSD/PSD mokėjimas",
  });

  const future = deadlines
    .filter((d) => d.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return future[0] || deadlines[0];
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/prisijungti");

  const currentYear = new Date().getFullYear();

  // Fetch workspace settings and income data
  const [settingsResult, incomeResult] = await Promise.all([
    query<{
      expense_method: string;
      additional_pension: boolean;
      employed_elsewhere: boolean;
      pvm_registered: boolean;
    }>("SELECT * FROM workspace_settings WHERE workspace_id = $1", [session.workspaceId]),
    query<{ month: number; amount: string }>(
      "SELECT month, amount FROM income_records WHERE workspace_id = $1 AND year = $2 ORDER BY month",
      [session.workspaceId, currentYear]
    ),
  ]);

  const settings = settingsResult.rows[0] || {
    expense_method: "30percent",
    additional_pension: false,
    employed_elsewhere: false,
  };

  const monthlyIncome: number[] = Array(12).fill(0);
  for (const row of incomeResult.rows) {
    monthlyIncome[row.month - 1] = parseFloat(row.amount);
  }

  const totalIncome = monthlyIncome.reduce((s, v) => s + v, 0);
  const taxResult = calculateTaxes(totalIncome, {
    expenseMethod: settings.expense_method as "30percent" | "actual",
    actualExpenses: 0,
    additionalPension: settings.additional_pension,
    employedElsewhere: settings.employed_elsewhere,
  });

  const maxMonthly = Math.max(...monthlyIncome, 1);
  const pvmProgress = Math.min((totalIncome / TAX_CONSTANTS_2026.PVM_THRESHOLD) * 100, 100);

  const nextDeadline = getNextDeadline();
  const daysUntil = Math.ceil(
    (nextDeadline.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{session.workspaceName}</h1>
          <p className="text-sm text-muted">
            {currentYear} m. suvestinė
          </p>
        </div>
        <Link
          href="/dashboard/pajamos"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-accent px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-light"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Įvesti pajamas
        </Link>
      </div>

      {/* Top cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted">Šių metų pajamos</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted">Mokesčiai</p>
          <p className="mt-1 text-2xl font-bold text-red-accent">
            {formatCurrency(taxResult.totalTax)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted">Grynasis pelnas</p>
          <p className="mt-1 text-2xl font-bold text-emerald-accent">
            {formatCurrency(taxResult.netIncome)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted">PVM riba</p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(totalIncome)}{" "}
            <span className="text-sm font-normal text-muted">
              / {formatCurrency(TAX_CONSTANTS_2026.PVM_THRESHOLD)}
            </span>
          </p>
          <div className="mt-2 h-2 rounded-full bg-border">
            <div
              className={`h-full rounded-full transition-all ${
                pvmProgress >= 90
                  ? "bg-red-accent"
                  : pvmProgress >= 70
                    ? "bg-yellow-accent"
                    : "bg-emerald-accent"
              }`}
              style={{ width: `${pvmProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly income chart */}
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Mėnesinės pajamos</h2>
          <div className="flex items-end gap-2" style={{ height: 180 }}>
            {monthlyIncome.map((amount, i) => {
              const height = maxMonthly > 0 ? (amount / maxMonthly) * 150 : 0;
              const isCurrentMonth = i === new Date().getMonth();
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-muted">
                    {amount > 0
                      ? amount.toLocaleString("lt-LT", { maximumFractionDigits: 0 })
                      : ""}
                  </span>
                  <div
                    className={`w-full rounded-t transition-all ${
                      isCurrentMonth
                        ? "bg-emerald-accent"
                        : amount > 0
                          ? "bg-emerald-accent/40"
                          : "bg-border"
                    }`}
                    style={{ height: Math.max(height, 4) }}
                  />
                  <span className={`text-xs ${isCurrentMonth ? "text-emerald-accent font-medium" : "text-muted"}`}>
                    {MONTH_NAMES[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next deadline */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Artėjantis terminas</h2>
          <div className="rounded-xl border border-emerald-border bg-emerald-muted p-4">
            <p className="text-sm font-medium text-emerald-accent">
              {nextDeadline.label}
            </p>
            <p className="mt-1 text-sm text-muted">
              {nextDeadline.description}
            </p>
            <p className="mt-3 text-2xl font-bold">
              {nextDeadline.date.toLocaleDateString("lt-LT")}
            </p>
            <p
              className={`mt-1 text-sm font-medium ${
                daysUntil <= 7
                  ? "text-red-accent"
                  : daysUntil <= 30
                    ? "text-yellow-accent"
                    : "text-emerald-accent"
              }`}
            >
              {daysUntil <= 0 ? "Šiandien!" : `Liko ${daysUntil} d.`}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <Link
              href="/dashboard/pajamos"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-emerald-border hover:text-foreground"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pajamų žurnalas
            </Link>
            <Link
              href="/terminai"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-emerald-border hover:text-foreground"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v9.75" />
              </svg>
              Visi terminai
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
