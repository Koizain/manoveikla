"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  calculateTaxes,
  formatCurrency,
  formatPercent,
  TAX_CONSTANTS_2026,
  type TaxOptions,
  type TaxResult,
} from "@/lib/tax";
import { GPM_DEADLINES } from "@/lib/deadlines";
import { EMPTY_MONTHLY_INCOMES, parseMonthlyIncomes } from "@/lib/storage";

const STORAGE_KEY = "manoveikla-inputs";
const TRACKER_KEY = "manoveikla-tracker";

const MONTHS = [
  "Sausis", "Vasaris", "Kovas", "Balandis",
  "Gegužė", "Birželis", "Liepa", "Rugpjūtis",
  "Rugsėjis", "Spalis", "Lapkritis", "Gruodis",
];

function getNextGPMDeadline(): { label: string; date: Date; daysLeft: number } | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const year = now.getFullYear();

  for (const dl of GPM_DEADLINES) {
    const date = new Date(year, dl.month, dl.day);
    date.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0) {
      return { label: dl.label, date, daysLeft: diff };
    }
  }
  // Next year Q1
  const nextQ1 = new Date(year + 1, 2, 15);
  nextQ1.setHours(0, 0, 0, 0);
  const diff = Math.ceil((nextQ1.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { label: "Kovo 15", date: nextQ1, daysLeft: diff };
}

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

function loadInputsFromURL(): Partial<InputState> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("income")) return null;
  const result: Partial<InputState> = {};
  const income = params.get("income");
  if (income) result.monthlyIncome = Number(income);
  const method = params.get("method");
  if (method === "30percent" || method === "actual") result.expenseMethod = method;
  const pension = params.get("pension");
  if (pension !== null) result.additionalPension = pension === "true";
  const employed = params.get("employed");
  if (employed !== null) result.employedElsewhere = employed === "true";
  const expenses = params.get("expenses");
  if (expenses) result.actualExpenses = Number(expenses);
  return result;
}

function findGrossForNet(targetNet: number, options: TaxOptions): { gross: number; result: TaxResult } {
  let low = 0;
  let high = targetNet * 3;
  let bestResult = calculateTaxes(0, options);

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const result = calculateTaxes(mid, options);
    if (Math.abs(result.netIncome - targetNet) < 1) {
      return { gross: mid, result };
    }
    if (result.netIncome < targetNet) {
      low = mid;
    } else {
      high = mid;
    }
    bestResult = result;
  }
  return { gross: (low + high) / 2, result: bestResult };
}

type TabType = "calculator" | "reverse";

export default function CalculatorPage() {
  const [inputs, setInputs] = useState<InputState>(defaultInputs);
  const [monthlyIncomes, setMonthlyIncomes] = useState<number[]>([...EMPTY_MONTHLY_INCOMES]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("calculator");
  const [copied, setCopied] = useState(false);

  // Reverse calculator state
  const [reverseNet, setReverseNet] = useState(2000);
  const [reverseExpenseMethod, setReverseExpenseMethod] = useState<"30percent" | "actual">("30percent");
  const [reversePension, setReversePension] = useState(false);
  const [reverseEmployed, setReverseEmployed] = useState(false);

  useEffect(() => {
    const urlInputs = loadInputsFromURL();
    if (urlInputs) {
      setInputs((prev) => ({ ...prev, ...urlInputs }));
    } else {
      setInputs(loadInputs());
    }
    setMonthlyIncomes(parseMonthlyIncomes(localStorage.getItem(TRACKER_KEY)));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    }
  }, [inputs, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(TRACKER_KEY, JSON.stringify(monthlyIncomes));
    }
  }, [monthlyIncomes, mounted]);

  const update = useCallback(
    <K extends keyof InputState>(key: K, value: InputState[K]) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleCopyLink = useCallback(() => {
    const params = new URLSearchParams();
    params.set("income", String(inputs.monthlyIncome));
    params.set("method", inputs.expenseMethod);
    params.set("pension", String(inputs.additionalPension));
    params.set("employed", String(inputs.employedElsewhere));
    if (inputs.expenseMethod === "actual" && inputs.actualExpenses > 0) {
      params.set("expenses", String(inputs.actualExpenses));
    }
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inputs]);

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
  const nextGPM = getNextGPMDeadline();

  // Expense optimizer hint
  const expenseOptimizerHint = useMemo(() => {
    if (annualIncome <= 0) return null;
    const threshold = annualIncome * TAX_CONSTANTS_2026.EXPENSE_DEDUCTION;
    return {
      annualIncome,
      threshold,
    };
  }, [annualIncome]);

  // Reverse calculator
  const reverseOptions: TaxOptions = useMemo(() => ({
    expenseMethod: reverseExpenseMethod,
    actualExpenses: 0,
    additionalPension: reversePension,
    employedElsewhere: reverseEmployed,
  }), [reverseExpenseMethod, reversePension, reverseEmployed]);

  const reverseResult = useMemo(() => {
    const annualTarget = reverseNet * 12;
    const { gross, result: taxResult } = findGrossForNet(annualTarget, reverseOptions);
    return {
      monthlyGross: gross / 12,
      annualGross: gross,
      gpm: taxResult.gpm,
      vsd: taxResult.vsd,
      psd: taxResult.psd,
      totalTax: taxResult.totalTax,
      effectiveRate: taxResult.effectiveRate,
      netIncome: taxResult.netIncome,
    };
  }, [reverseNet, reverseOptions]);

  const actionItems = [
    {
      title: nextGPM
        ? `Pasiruoškite GPM avansui iki ${nextGPM.label}`
        : "Pasitikrinkite artimiausią GPM terminą",
      description: nextGPM
        ? `Prognozuojama suma: ~${formatCurrency(result.gpm / 4)}. ${nextGPM.daysLeft === 0 ? "Terminas šiandien." : `Liko ${nextGPM.daysLeft} d.`}`
        : "Sekite ketvirtinius GPM avansinius mokėjimus.",
      level: nextGPM && nextGPM.daysLeft <= 14 ? "high" : "medium",
    },
    {
      title:
        pvmProgress >= 100
          ? "Registruokitės PVM mokėtoju"
          : pvmProgress >= 80
            ? "Planuokite PVM registraciją"
            : "Stebėkite PVM ribą",
      description:
        pvmProgress >= 100
          ? "Viršyta 45 000 € riba — registracija būtina nedelsiant."
          : pvmProgress >= 80
            ? "Esate arti 45 000 € ribos, peržiūrėkite artimiausių mėnesių planą."
            : "Kol kas rizika maža, bet verta tikrinti progresą kas mėnesį.",
      level: pvmProgress >= 100 ? "high" : pvmProgress >= 80 ? "medium" : "low",
    },
    {
      title: "Atsidėkite mokesčių rezervą",
      description: `Rekomenduojama atsidėti ~${formatCurrency(display.totalTax)} ${inputs.period === "monthly" ? "per mėnesį" : "per metus"}.`,
      level: "low",
    },
  ] as const;

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

      {/* Tab Selector */}
      <div className="mb-8 flex gap-2">
        <button
          onClick={() => setActiveTab("calculator")}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
            activeTab === "calculator"
              ? "bg-emerald-accent text-black"
              : "border border-border text-muted hover:text-foreground"
          }`}
        >
          Skaičiuoklė
        </button>
        <button
          onClick={() => setActiveTab("reverse")}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
            activeTab === "reverse"
              ? "bg-emerald-accent text-black"
              : "border border-border text-muted hover:text-foreground"
          }`}
        >
          Kiek fakturuoti?
        </button>
      </div>

      {activeTab === "reverse" ? (
        /* Reverse Calculator Tab */
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-5 text-lg font-semibold">Norimas grynasis atlyginimas</h2>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-muted">
                  Grynos pajamos per mėnesį
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={500}
                    max={10000}
                    value={reverseNet}
                    onChange={(e) => setReverseNet(Math.max(500, Math.min(10000, Number(e.target.value))))}
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-8 text-lg font-semibold outline-none transition-colors focus:border-emerald-accent"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">€</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={10000}
                  step={50}
                  value={reverseNet}
                  onChange={(e) => setReverseNet(Number(e.target.value))}
                  className="mt-3 w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>500 €</span>
                  <span>10 000 €</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-muted">
                  Sąnaudų metodas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReverseExpenseMethod("30percent")}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                      reverseExpenseMethod === "30percent"
                        ? "border-emerald-accent bg-emerald-muted text-emerald-accent"
                        : "border-border text-muted hover:border-foreground/20"
                    }`}
                  >
                    30% standartinis
                  </button>
                  <button
                    onClick={() => setReverseExpenseMethod("actual")}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                      reverseExpenseMethod === "actual"
                        ? "border-emerald-accent bg-emerald-muted text-emerald-accent"
                        : "border-border text-muted hover:border-foreground/20"
                    }`}
                  >
                    Faktinės sąnaudos
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <Toggle
                  label="Kaupiate pensijai papildomai?"
                  description="Prideda 3% pensijų kaupimo įmoką"
                  checked={reversePension}
                  onChange={setReversePension}
                />
                <Toggle
                  label="Dirbate samdoje?"
                  description="PSD jau mokamas per darbdavį"
                  checked={reverseEmployed}
                  onChange={setReverseEmployed}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                label="Reikia fakturuoti per mėnesį"
                value={formatCurrency(reverseResult.monthlyGross)}
                icon="📤"
                highlight
              />
              <MetricCard
                label="Reikia fakturuoti per metus"
                value={formatCurrency(reverseResult.annualGross)}
                icon="📊"
              />
              <MetricCard
                label="Grynos pajamos per mėnesį"
                value={formatCurrency(reverseResult.netIncome / 12)}
                icon="✅"
              />
              <MetricCard
                label="Efektyvus mokesčių tarifas"
                value={formatPercent(reverseResult.effectiveRate)}
                icon="📉"
              />
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Mokesčių išskaidymas (metinis)</h3>
              <div className="space-y-4">
                <TaxRow
                  label="GPM (gyventojų pajamų mokestis)"
                  value={reverseResult.gpm}
                  rate="20%"
                  total={reverseResult.totalTax}
                />
                <TaxRow
                  label="VSD (socialinis draudimas)"
                  value={reverseResult.vsd}
                  rate={reversePension ? "15,52%" : "12,52%"}
                  total={reverseResult.totalTax}
                />
                <TaxRow
                  label="PSD (sveikatos draudimas)"
                  value={reverseResult.psd}
                  rate={reverseEmployed ? "0%" : "6,98%"}
                  total={reverseResult.totalTax}
                />
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Visi mokesčiai per metus</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(reverseResult.totalTax)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-muted">
                    <span>Mokesčiai per mėnesį</span>
                    <span className="font-semibold">
                      {formatCurrency(reverseResult.totalTax / 12)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Calculator Tab */
        <>
          <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
            {/* Input Panel */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Parametrai</h2>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-all hover:border-foreground/20 hover:text-foreground"
                    title="Kopijuoti nuorodą"
                  >
                    {copied ? (
                      <span className="text-emerald-accent">Nukopijuota!</span>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        Kopijuoti nuorodą
                      </>
                    )}
                  </button>
                </div>

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

                  {/* Expense Optimizer Hint */}
                  {expenseOptimizerHint && (
                    <p className="mt-3 rounded-lg bg-emerald-muted/30 px-3 py-2 text-xs text-muted">
                      Jūsų pajamoms ({formatCurrency(expenseOptimizerHint.annualIncome)}/metus) apsimoka fiksuoti faktines sąnaudas jei jos viršija {formatCurrency(expenseOptimizerHint.threshold)}
                    </p>
                  )}
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

              {/* Action Plan */}
              <div className="rounded-2xl border border-emerald-border bg-emerald-muted/20 p-6">
                <h3 className="mb-4 text-lg font-semibold">Ką daryti dabar?</h3>
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-border bg-card/70 p-3">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">{item.title}</div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.level === "high"
                              ? "bg-red-accent/20 text-red-accent"
                              : item.level === "medium"
                                ? "bg-yellow-accent/20 text-yellow-accent"
                                : "bg-emerald-accent/20 text-emerald-accent"
                          }`}
                        >
                          {item.level === "high" ? "Aukštas" : item.level === "medium" ? "Vidutinis" : "Žemas"}
                        </span>
                      </div>
                      <p className="text-xs text-muted">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Running Total Tracker */}
          <RunningTotalTracker
            monthlyIncomes={monthlyIncomes}
            setMonthlyIncomes={setMonthlyIncomes}
            options={options}
          />
        </>
      )}
    </div>
  );
}

function RunningTotalTracker({
  monthlyIncomes,
  setMonthlyIncomes,
  options,
}: {
  monthlyIncomes: number[];
  setMonthlyIncomes: (v: number[]) => void;
  options: TaxOptions;
}) {
  const updateMonth = (index: number, value: number) => {
    const updated = [...monthlyIncomes];
    updated[index] = Math.max(0, value);
    setMonthlyIncomes(updated);
  };

  // Calculate running totals
  const runningTotals = MONTHS.map((_, i) => {
    const ytdIncome = monthlyIncomes.slice(0, i + 1).reduce((a, b) => a + b, 0);
    const ytdResult = calculateTaxes(ytdIncome, options);
    return {
      income: ytdIncome,
      tax: ytdResult.totalTax,
      net: ytdResult.netIncome,
    };
  });

  const totalIncome = monthlyIncomes.reduce((a, b) => a + b, 0);
  const pvmThreshold = TAX_CONSTANTS_2026.PVM_THRESHOLD;
  const pvmProgress = Math.min((totalIncome / pvmThreshold) * 100, 100);
  const pvmColor = pvmProgress < 60 ? "bg-emerald-accent" : pvmProgress < 80 ? "bg-yellow-accent" : "bg-red-accent";

  const nextGPM = getNextGPMDeadline();
  const yearResult = calculateTaxes(totalIncome, options);
  const quarterlyGPM = yearResult.gpm / 4;

  return (
    <div className="mt-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Mano metinė apskaita</h2>
        <p className="mt-2 text-muted">
          Įvesk kiekvieno mėnesio pajamas ir sek savo metinius rodiklius
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-1 text-sm text-muted">Pajamos (YTD)</div>
          <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-1 text-sm text-muted">Mokesčiai (YTD)</div>
          <div className="text-2xl font-bold text-red-accent">
            {formatCurrency(yearResult.totalTax)}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-border bg-emerald-muted p-5">
          <div className="mb-1 text-sm text-muted">Grynasis pelnas (YTD)</div>
          <div className="text-2xl font-bold text-emerald-accent">
            {formatCurrency(yearResult.netIncome)}
          </div>
        </div>
      </div>

      {/* PVM Progress Bar */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">PVM registracijos riba</h3>
          <span className="text-sm text-muted">
            {formatCurrency(totalIncome)} / {formatCurrency(pvmThreshold)}
          </span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pvmColor}`}
            style={{ width: `${pvmProgress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>0 €</span>
          <span className="text-emerald-accent">27 000 € (60%)</span>
          <span className="text-yellow-accent">36 000 € (80%)</span>
          <span>45 000 €</span>
        </div>
      </div>

      {/* Next GPM Payment */}
      {nextGPM && totalIncome > 0 && (
        <div className="mb-6 rounded-2xl border border-emerald-border bg-emerald-muted/30 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-muted">Kitas GPM avansinis mokėjimas</div>
              <div className="text-lg font-bold">{nextGPM.label}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted">{nextGPM.daysLeft === 0 ? "Terminas šiandien" : `Liko ${nextGPM.daysLeft} d.`}</div>
              <div className="text-lg font-bold text-emerald-accent">
                ~{formatCurrency(quarterlyGPM)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Inputs Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MONTHS.map((month, i) => (
          <div key={month} className="rounded-xl border border-border bg-card p-4">
            <label className="mb-2 block text-sm font-medium text-muted">
              {month}
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                value={monthlyIncomes[i] || ""}
                placeholder="0"
                onChange={(e) => updateMonth(i, Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-7 text-sm font-semibold outline-none transition-colors focus:border-emerald-accent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">€</span>
            </div>
            {monthlyIncomes[i] > 0 && (
              <div className="mt-2 space-y-0.5 text-xs text-muted">
                <div className="flex justify-between">
                  <span>Pajamos YTD</span>
                  <span>{formatCurrency(runningTotals[i].income)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mokesčiai YTD</span>
                  <span className="text-red-accent">{formatCurrency(runningTotals[i].tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grynasis YTD</span>
                  <span className="text-emerald-accent">{formatCurrency(runningTotals[i].net)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
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
