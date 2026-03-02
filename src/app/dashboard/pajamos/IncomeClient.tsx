"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addIncomeAction } from "@/lib/actions";
import { formatCurrency } from "@/lib/tax";

interface IncomeRecord {
  id: string | null;
  month: number;
  monthName: string;
  amount: number;
  description: string;
  runningTotal: number;
  taxes: { gpm: number; vsd: number; psd: number; total: number };
}

export default function IncomeClient({
  records,
  year,
  isViewer,
}: {
  records: IncomeRecord[];
  year: number;
  isViewer: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [error, setError] = useState("");

  function startEdit(record: IncomeRecord) {
    if (isViewer) return;
    setEditingMonth(record.month);
    setEditAmount(record.amount > 0 ? record.amount.toString() : "");
    setError("");
  }

  async function saveEdit(month: number) {
    setError("");
    const formData = new FormData();
    formData.set("year", year.toString());
    formData.set("month", month.toString());
    formData.set("amount", editAmount || "0");

    const result = await addIncomeAction(formData);
    if (result?.error) {
      setError(result.error);
      return;
    }

    setEditingMonth(null);
    startTransition(() => router.refresh());
  }

  function cancelEdit() {
    setEditingMonth(null);
    setError("");
  }

  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="rounded-2xl border border-border bg-card">
      {error && (
        <div className="border-b border-red-accent/30 bg-red-accent/10 p-3 text-sm text-red-accent">
          {error}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted">
              <th className="px-5 py-3 font-medium">Mėnuo</th>
              <th className="px-5 py-3 font-medium text-right">Pajamos</th>
              <th className="px-5 py-3 font-medium text-right">Bendra suma</th>
              <th className="px-5 py-3 font-medium text-right">GPM</th>
              <th className="px-5 py-3 font-medium text-right">VSD</th>
              <th className="px-5 py-3 font-medium text-right">PSD</th>
              <th className="px-5 py-3 font-medium text-right">Mokesčiai viso</th>
              {!isViewer && <th className="px-5 py-3 font-medium w-20"></th>}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.month}
                className={`border-b border-border last:border-0 ${
                  record.month === currentMonth ? "bg-emerald-muted/30" : ""
                } ${record.month > currentMonth && record.amount === 0 ? "opacity-40" : ""}`}
              >
                <td className="px-5 py-3 text-sm font-medium">
                  {record.monthName}
                  {record.month === currentMonth && (
                    <span className="ml-2 text-xs text-emerald-accent">dabar</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right text-sm">
                  {editingMonth === record.month ? (
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(record.month);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="w-28 rounded border border-emerald-accent bg-background px-2 py-1 text-right text-sm outline-none"
                      autoFocus
                      min={0}
                      step={0.01}
                    />
                  ) : (
                    <span className={record.amount > 0 ? "font-medium" : "text-muted"}>
                      {record.amount > 0 ? formatCurrency(record.amount) : "—"}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right text-sm text-muted">
                  {record.runningTotal > 0 ? formatCurrency(record.runningTotal) : "—"}
                </td>
                <td className="px-5 py-3 text-right text-sm text-muted">
                  {record.runningTotal > 0 ? formatCurrency(record.taxes.gpm) : "—"}
                </td>
                <td className="px-5 py-3 text-right text-sm text-muted">
                  {record.runningTotal > 0 ? formatCurrency(record.taxes.vsd) : "—"}
                </td>
                <td className="px-5 py-3 text-right text-sm text-muted">
                  {record.runningTotal > 0 ? formatCurrency(record.taxes.psd) : "—"}
                </td>
                <td className="px-5 py-3 text-right text-sm font-medium text-red-accent">
                  {record.runningTotal > 0 ? formatCurrency(record.taxes.total) : "—"}
                </td>
                {!isViewer && (
                  <td className="px-5 py-3 text-right">
                    {editingMonth === record.month ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => saveEdit(record.month)}
                          disabled={isPending}
                          className="rounded px-2 py-1 text-xs text-emerald-accent hover:bg-emerald-muted"
                        >
                          {isPending ? "..." : "OK"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded px-2 py-1 text-xs text-muted hover:bg-border"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(record)}
                        className="rounded px-2 py-1 text-xs text-muted hover:bg-border hover:text-foreground"
                      >
                        {record.amount > 0 ? "Redaguoti" : "Įvesti"}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-border">
        {records.map((record) => (
          <div
            key={record.month}
            className={`p-4 ${
              record.month === currentMonth ? "bg-emerald-muted/30" : ""
            } ${record.month > currentMonth && record.amount === 0 ? "opacity-40" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">
                {record.monthName}
                {record.month === currentMonth && (
                  <span className="ml-2 text-xs text-emerald-accent">dabar</span>
                )}
              </span>
              {!isViewer && editingMonth !== record.month && (
                <button
                  onClick={() => startEdit(record)}
                  className="rounded px-2 py-1 text-xs text-muted hover:bg-border hover:text-foreground"
                >
                  {record.amount > 0 ? "Redaguoti" : "Įvesti"}
                </button>
              )}
            </div>

            {editingMonth === record.month ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="flex-1 rounded border border-emerald-accent bg-background px-3 py-2 text-sm outline-none"
                  autoFocus
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                />
                <button
                  onClick={() => saveEdit(record.month)}
                  disabled={isPending}
                  className="rounded bg-emerald-accent px-3 py-2 text-xs font-semibold text-black"
                >
                  {isPending ? "..." : "OK"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded border border-border px-3 py-2 text-xs text-muted"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted">Pajamos: </span>
                  <span className={record.amount > 0 ? "font-medium" : "text-muted"}>
                    {record.amount > 0 ? formatCurrency(record.amount) : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Bendra: </span>
                  <span>{record.runningTotal > 0 ? formatCurrency(record.runningTotal) : "—"}</span>
                </div>
                {record.runningTotal > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted">Mokesčiai: </span>
                    <span className="font-medium text-red-accent">
                      {formatCurrency(record.taxes.total)}
                    </span>
                    <span className="text-muted text-xs ml-1">
                      (GPM {formatCurrency(record.taxes.gpm)}, VSD {formatCurrency(record.taxes.vsd)}, PSD {formatCurrency(record.taxes.psd)})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
