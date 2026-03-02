"use client";

import { useState, useEffect, useCallback } from "react";
import {
  calculateTaxes,
  formatCurrency,
  formatPercent,
  TAX_CONSTANTS_2026,
  type TaxOptions,
  type TaxResult,
} from "@/lib/tax";

const STORAGE_KEY = "manoveikla-inputs";

interface InputState {
  monthlyIncome: number;
  expenseMethod: "30percent" | "actual";
  actualExpenses: number;
  additionalPension: boolean;
  employedElsewhere: boolean;
  period: "monthly" | "annual";
}

const defaultInputs: InputState = {
  monthlyIncome: 2000,
  expenseMethod: "30percent",
  actualExpenses: 0,
  additionalPension: false,
  employedElsewhere: false,
  period: "monthly",
};

function loadInputs(): InputState {
  if (typeof window === "undefined") return defaultInputs;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultInputs, ...JSON.parse(saved) };
  } catch {}
  return defaultInputs;
}

export default function CalculatorPage() {
  const [inputs, setInputs] = useState<InputState>(defaultInputs);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setInputs(loadInputs());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    }
  }, [inputs, mounted]);

  const update = useCallback(
    <K extends keyof InputState>(key: K, value: InputState[K]) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const annualIncome = inputs.monthlyIncome * 12;
  const options: TaxOptions = {
    expenseMethod: inputs.expenseMethod,
    actualExpenses:
      inputs.expenseMethod === "actual" ? inputs.actualExpenses * 12 : 0,
    additionalPension: inputs.additionalPension,
    employedElsewhere: inputs.employedElsewhere,
  };

  const result = calculateTaxes(annualIncome, options);
  const monthlyResult: TaxResult = {
    income: result.income / 12,
    expenses: result.expenses / 12,
    taxableIncome: result.taxableIncome / 12,
    gpm: result.gpm / 12,
    vsd: result.vsd / 12,
    psd: result.psd / 12,
    totalTax: result.totalTax / 12,
    netIncome: result.netIncome / 12,
    effectiveRate: result.effectiveRate,
  };

  const display = inputs.period === "monthly" ? monthlyResult : result;

  const burdenColor =
    display.effectiveRate < 20
      ? "text-emerald-accent"
      : display.effectiveRate < 30
        ? "text-yellow-accent"
        : "text-red-accent";
  const burdenBarColor =
    display.effectiveRate < 20
      ? "bg-emerald-accent"
      : display.effectiveRate < 30
        ? "bg-yellow-accent"
        : "bg-red-accent";

  const pvmProgress = Math.min((annualIncome / TAX_CONSTANTS_2026.PVM_THRESHOLD) * 100, 100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Mokesčių skaičiuoklė
        </h1>
        <p className="mt-2 text-muted">
          Individualios veiklos mokesčiai 2026 metams
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Input Panel */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-5 text-lg font-semibold">Parametrai</h2>

            {/* Monthly Income */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-muted">
                Mėnesinės pajamos
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={inputs.monthlyIncome}
                  onChange={(e) =>
                    update(
                      "monthlyIncome",
                      Math.max(0, Number(e.target.value))
                    )
                  }
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-8 text-lg font-semibold outline-none transition-colors focus:border-emerald-accent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                  €
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={20000}
                step={100}
                value={inputs.monthlyIncome}
                onChange={(e) =>
                  update("monthlyIncome", Number(e.target.value))
                }
                className="mt-3 w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>0 €</span>
                <span>20 000 €</span>
              </div>
            </div>

            {/* Expense Method */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-muted">
                Sąnaudų metodas
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => update("expenseMethod", "30percent")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    inputs.expenseMethod === "30percent"
                      ? "border-emerald-accent bg-emerald-muted text-emerald-accent"
                      : "border-border text-muted hover:border-foreground/20"
                  }`}
                >
                  30% standartinis
                </button>
                <button
                  onClick={() => update("expenseMethod", "actual")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    inputs.expenseMethod === "actual"
                      ? "border-emerald-accent bg-emerald-muted text-emerald-accent"
                      : "border-border text-muted hover:border-foreground/20"
                  }`}
                >
                  Faktinės sąnaudos
                </button>
              </div>
            </div>

            {/* Actual Expenses */}
            {inputs.expenseMethod === "actual" && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-muted">
                  Faktinės sąnaudos per mėn.
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={inputs.actualExpenses}
                    onChange={(e) =>
                      update(
                        "actualExpenses",
                        Math.max(0, Number(e.target.value))
                      )
                    }
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-8 text-lg font-semibold outline-none transition-colors focus:border-emerald-accent"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                    €
                  </span>
                </div>
              </div>
            )}

            {/* Toggles */}
            <div className="space-y-4">
              <Toggle
                label="Kaupiate pensijai papildomai?"
                description="Prideda 3% pensijų kaupimo įmoką"
                checked={inputs.additionalPension}
                onChange={(v) => update("additionalPension", v)}
              />
              <Toggle
                label="Dirbate samdoje?"
                description="PSD jau mokamas per darbdavį"
                checked={inputs.employedElsewhere}
                onChange={(v) => update("employedElsewhere", v)}
              />
            </div>
          </div>

          {/* Period Selector */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => update("period", "monthly")}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  inputs.period === "monthly"
                    ? "bg-emerald-accent text-black"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Mėnesinis
              </button>
              <button
                onClick={() => update("period", "annual")}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  inputs.period === "annual"
                    ? "bg-emerald-accent text-black"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Metinis
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="Pajamos"
              value={formatCurrency(display.income)}
              icon="📊"
            />
            <MetricCard
              label="Sąnaudos"
              value={formatCurrency(display.expenses)}
              icon="📉"
              sublabel={
                inputs.expenseMethod === "30percent"
                  ? "30% standartinis atskaitymas"
                  : "Faktinės sąnaudos"
              }
            />
            <MetricCard
              label="Apmokestinamos pajamos"
              value={formatCurrency(display.taxableIncome)}
              icon="💰"
            />
            <MetricCard
              label="Grynasis pelnas"
              value={formatCurrency(display.netIncome)}
              icon="✅"
              highlight
            />
          </div>

          {/* Tax Breakdown */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Mokesčių išskaidymas</h3>
            <div className="space-y-4">
              <TaxRow
                label="GPM (gyventojų pajamų mokestis)"
                value={display.gpm}
                rate="20%"
                total={display.totalTax}
              />
              <TaxRow
                label="VSD (socialinis draudimas)"
                value={display.vsd}
                rate={
                  inputs.additionalPension ? "15,52%" : "12,52%"
                }
                total={display.totalTax}
              />
              <TaxRow
                label="PSD (sveikatos draudimas)"
                value={display.psd}
                rate={inputs.employedElsewhere ? "0%" : "6,98%"}
                total={display.totalTax}
              />
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Visi mokesčiai</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(display.totalTax)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Burden Gauge */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Mokestinė našta</h3>
              <span className={`text-2xl font-bold ${burdenColor}`}>
                {formatPercent(display.effectiveRate)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${burdenBarColor}`}
                style={{ width: `${Math.min(display.effectiveRate, 50) * 2}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>0%</span>
              <span className="text-emerald-accent">20%</span>
              <span className="text-yellow-accent">30%</span>
              <span>50%</span>
            </div>
          </div>

          {/* PVM Tracker */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">PVM registracijos riba</h3>
              <span className="text-sm text-muted">
                {formatCurrency(annualIncome)} / {formatCurrency(TAX_CONSTANTS_2026.PVM_THRESHOLD)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pvmProgress >= 100 ? "bg-red-accent" : pvmProgress >= 80 ? "bg-yellow-accent" : "bg-emerald-accent"
                }`}
                style={{ width: `${pvmProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {pvmProgress >= 100
                ? "Viršyta 45 000 € riba — privalote registruotis PVM mokėtoju"
                : pvmProgress >= 80
                  ? "Artėjate prie PVM registracijos ribos"
                  : "Iki PVM registracijos ribos dar toli"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  sublabel,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-emerald-border bg-emerald-muted"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-1 flex items-center gap-2 text-sm text-muted">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div
        className={`text-2xl font-bold ${highlight ? "text-emerald-accent" : ""}`}
      >
        {value}
      </div>
      {sublabel && <div className="mt-1 text-xs text-muted">{sublabel}</div>}
    </div>
  );
}

function TaxRow({
  label,
  value,
  rate,
  total,
}: {
  label: string;
  value: number;
  rate: string;
  total: number;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm">
          <span>{label}</span>
          <span className="ml-2 text-xs text-muted">({rate})</span>
        </div>
        <span className="font-semibold">{formatCurrency(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-emerald-accent/60 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 text-left"
    >
      <div
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          checked ? "bg-emerald-accent" : "bg-white/10"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted">{description}</div>
      </div>
    </button>
  );
}
