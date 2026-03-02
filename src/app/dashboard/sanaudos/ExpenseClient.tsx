"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addExpenseAction, deleteExpenseAction } from "@/lib/actions";
import { formatCurrency } from "@/lib/tax";

const MONTH_NAMES = [
  "Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis",
  "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis",
];

interface Expense {
  id: string;
  month: number;
  amount: number;
  category: string;
  description: string;
}

export default function ExpenseClient({
  expenses,
  categories,
  year,
  isViewer,
}: {
  expenses: Expense[];
  categories: string[];
  year: number;
  isViewer: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("year", year.toString());
    const result = await addExpenseAction(formData);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setShowForm(false);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    const formData = new FormData();
    formData.set("id", id);
    await deleteExpenseAction(formData);
    startTransition(() => router.refresh());
  }

  const currentMonth = new Date().getMonth() + 1;

  return (
    <div>
      {/* Add button */}
      {!isViewer && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 inline-flex items-center gap-2 rounded-lg bg-emerald-accent px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-light"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Pridėti sąnaudą
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-emerald-border bg-card p-5">
          <h3 className="mb-4 font-semibold">Nauja sąnauda</h3>
          {error && (
            <div className="mb-3 rounded-lg border border-red-accent/30 bg-red-accent/10 p-3 text-sm text-red-accent">
              {error}
            </div>
          )}
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Mėnuo</label>
              <select
                name="month"
                defaultValue={currentMonth}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Suma (€)</label>
              <input
                name="amount"
                type="number"
                min={0.01}
                step={0.01}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kategorija</label>
              <select
                name="category"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Aprašymas</label>
              <input
                name="description"
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent"
                placeholder="Neprivaloma"
              />
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-emerald-accent px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-light disabled:opacity-50"
              >
                {isPending ? "Saugoma..." : "Pridėti"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted hover:text-foreground"
              >
                Atšaukti
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense list */}
      <div className="rounded-2xl border border-border bg-card">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            Nėra įrašytų sąnaudų šiais metais
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted">
                    <th className="px-5 py-3 font-medium">Mėnuo</th>
                    <th className="px-5 py-3 font-medium">Kategorija</th>
                    <th className="px-5 py-3 font-medium">Aprašymas</th>
                    <th className="px-5 py-3 font-medium text-right">Suma</th>
                    {!isViewer && <th className="px-5 py-3 w-16"></th>}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-sm">{MONTH_NAMES[expense.month - 1]}</td>
                      <td className="px-5 py-3 text-sm">
                        <span className="rounded-full bg-emerald-muted px-2 py-0.5 text-xs text-emerald-accent">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted">
                        {expense.description || "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      {!isViewer && (
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDelete(expense.id)}
                            disabled={isPending}
                            className="rounded px-2 py-1 text-xs text-red-accent hover:bg-red-accent/10"
                          >
                            Trinti
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-border">
              {expenses.map((expense) => (
                <div key={expense.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{MONTH_NAMES[expense.month - 1]}</span>
                    <span className="text-sm font-medium">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="rounded-full bg-emerald-muted px-2 py-0.5 text-xs text-emerald-accent">
                        {expense.category}
                      </span>
                      {expense.description && (
                        <span className="ml-2 text-xs text-muted">{expense.description}</span>
                      )}
                    </div>
                    {!isViewer && (
                      <button
                        onClick={() => handleDelete(expense.id)}
                        disabled={isPending}
                        className="text-xs text-red-accent"
                      >
                        Trinti
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
