import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/tax";
import ExpenseClient from "./ExpenseClient";

const CATEGORIES = [
  "Biuro nuoma",
  "Ryšiai ir internetas",
  "Transportas",
  "Programinė įranga",
  "Įranga ir technika",
  "Buhalterija",
  "Reklama ir rinkodara",
  "Kita",
];

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) redirect("/prisijungti");

  const currentYear = new Date().getFullYear();

  const [settingsResult, expenseResult] = await Promise.all([
    query<{ expense_method: string }>(
      "SELECT expense_method FROM workspace_settings WHERE workspace_id = $1",
      [session.workspaceId]
    ),
    query<{
      id: string;
      month: number;
      amount: string;
      category: string;
      description: string;
      created_at: string;
    }>(
      "SELECT id, month, amount, category, description, created_at FROM expense_records WHERE workspace_id = $1 AND year = $2 ORDER BY month DESC, created_at DESC",
      [session.workspaceId, currentYear]
    ),
  ]);

  const settings = settingsResult.rows[0];
  const isActual = settings?.expense_method === "actual";

  if (!isActual) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-4 text-2xl font-bold">Sąnaudos</h1>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-accent/10">
            <svg className="h-6 w-6 text-yellow-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">30% sąnaudų atskaitymas</h2>
          <p className="mt-2 text-sm text-muted">
            Jūsų darbo erdvė naudoja 30% fiksuotą sąnaudų atskaitymą.
            Sąnaudų sekimas nėra reikalingas.
          </p>
          <p className="mt-4 text-sm text-muted">
            Norėdami sekti faktines sąnaudas, pakeiskite sąnaudų metodą{" "}
            <a href="/dashboard/nustatymai" className="text-emerald-accent hover:text-emerald-light">
              nustatymuose
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  const expenses = expenseResult.rows.map((r) => ({
    id: r.id,
    month: r.month,
    amount: parseFloat(r.amount),
    category: r.category || "Kita",
    description: r.description || "",
  }));

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  // Group by category for summary
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  const isViewer = session.role === "viewer";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sąnaudos</h1>
          <p className="text-sm text-muted">{currentYear} m. faktinės sąnaudos</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted">Viso sąnaudų</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
        </div>
        {Object.entries(byCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat, amount]) => (
            <div key={cat} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted">{cat}</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(amount)}</p>
            </div>
          ))}
      </div>

      <ExpenseClient
        expenses={expenses}
        categories={CATEGORIES}
        year={currentYear}
        isViewer={isViewer}
      />
    </div>
  );
}
