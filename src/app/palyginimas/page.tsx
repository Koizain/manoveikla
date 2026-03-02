"use client";

import { useState, useEffect } from "react";
import {
  calculateTaxes,
  calculateMBTaxes,
  formatCurrency,
  formatPercent,
  type TaxOptions,
} from "@/lib/tax";

const STORAGE_KEY = "manoveikla-comparison";

export default function ComparisonPage() {
  const [monthlyIncome, setMonthlyIncome] = useState(3000);
  const [firstTwoYears, setFirstTwoYears] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.monthlyIncome) setMonthlyIncome(parsed.monthlyIncome);
        if (parsed.firstTwoYears !== undefined) setFirstTwoYears(parsed.firstTwoYears);
      }
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ monthlyIncome, firstTwoYears }));
    }
  }, [monthlyIncome, firstTwoYears, mounted]);

  const annualIncome = monthlyIncome * 12;

  const ivOptions: TaxOptions = {
    expenseMethod: "30percent",
    actualExpenses: 0,
    additionalPension: false,
    employedElsewhere: false,
  };
  const ivResult = calculateTaxes(annualIncome, ivOptions);
  const mbResult = calculateMBTaxes(annualIncome, { firstTwoYears });

  const ivBetter = ivResult.netIncome >= mbResult.netIncome;
  const diff = Math.abs(mbResult.netIncome - ivResult.netIncome);
  const diffMonthly = diff / 12;

  // Find breakeven point
  let breakeven = 0;
  for (let m = 500; m <= 20000; m += 100) {
    const annual = m * 12;
    const iv = calculateTaxes(annual, ivOptions);
    const mb = calculateMBTaxes(annual, { firstTwoYears });
    if (mb.netIncome > iv.netIncome) {
      breakeven = m;
      break;
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          IV vs MB — kas apsimoka?
        </h1>
        <p className="mt-2 text-muted">
          Individuali veikla vs Mažoji bendrija — palyginimas 2026 metams
        </p>
      </div>

      {/* Income Input */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <label className="mb-2 block text-sm font-medium text-muted">
          Mėnesinės pajamos (prieš mokesčius)
        </label>
        <div className="relative">
          <input
            type="number"
            min={0}
            max={100000}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
            className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-8 text-lg font-semibold outline-none transition-colors focus:border-emerald-accent"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">€</span>
        </div>
        <input
          type="range"
          min={0}
          max={20000}
          step={100}
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(Number(e.target.value))}
          className="mt-3 w-full"
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>0 €</span>
          <span>20 000 €</span>
        </div>

        {/* MB years toggle */}
        <div className="mt-4">
          <button
            onClick={() => setFirstTwoYears(!firstTwoYears)}
            className="flex items-start gap-3 text-left"
          >
            <div
              className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                firstTwoYears ? "bg-emerald-accent" : "bg-white/10"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition-transform ${
                  firstTwoYears ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
            <div>
              <div className="text-sm font-medium">MB veikia pirmus 2 metus?</div>
              <div className="text-xs text-muted">
                Pirmus 2 metus pelno mokestis 0% (pajamos iki 300 000 €)
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Savings banner */}
      {diff > 0 && (
        <div className="mb-8 rounded-2xl border border-emerald-border bg-emerald-muted p-5">
          <p className="text-center text-lg">
            {ivBetter ? (
              <>
                Su <span className="font-bold text-emerald-accent">individualia veikla</span> sutaupytum{" "}
                <span className="font-bold text-emerald-accent">{formatCurrency(diff)}</span> per metus
                ({formatCurrency(diffMonthly)}/mėn.)
              </>
            ) : (
              <>
                Jei uždirbi daugiau nei{" "}
                <span className="font-bold text-emerald-accent">{formatCurrency(breakeven)}/mėn.</span>
                {" "}— <span className="font-bold text-emerald-accent">MB</span> tau sutaupytų{" "}
                <span className="font-bold text-emerald-accent">{formatCurrency(diff)}</span> per metus
                ({formatCurrency(diffMonthly)}/mėn.)
              </>
            )}
          </p>
        </div>
      )}

      {/* Comparison Columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* IV Column */}
        <div className={`rounded-2xl border p-6 ${ivBetter ? "border-emerald-border bg-emerald-muted/30" : "border-border bg-card"}`}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Individuali veikla</h2>
            {ivBetter && (
              <span className="rounded-full bg-emerald-accent px-3 py-1 text-xs font-bold text-black">
                Apsimoka
              </span>
            )}
          </div>

          <div className="space-y-3">
            <Row label="Metinės pajamos" value={formatCurrency(ivResult.income)} />
            <Row label="Sąnaudos (30%)" value={formatCurrency(ivResult.expenses)} muted />
            <Row label="Apmokestinamos pajamos" value={formatCurrency(ivResult.taxableIncome)} />
            <Divider />
            <Row label="GPM (20–32%)" value={formatCurrency(ivResult.gpm)} negative />
            <Row label="VSD (12,52%)" value={formatCurrency(ivResult.vsd)} negative />
            <Row label="PSD (6,98%)" value={formatCurrency(ivResult.psd)} negative />
            <Divider />
            <Row label="Visi mokesčiai" value={formatCurrency(ivResult.totalTax)} bold negative />
            <Row label="Mokestinė našta" value={formatPercent(ivResult.effectiveRate)} />
            <div className="rounded-xl bg-emerald-muted p-4">
              <Row label="Grynasis pelnas" value={formatCurrency(ivResult.netIncome)} bold highlight />
              <div className="mt-1 text-xs text-muted">
                {formatCurrency(ivResult.netIncome / 12)} / mėn.
              </div>
            </div>
          </div>
        </div>

        {/* MB Column */}
        <div className={`rounded-2xl border p-6 ${!ivBetter ? "border-emerald-border bg-emerald-muted/30" : "border-border bg-card"}`}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Mažoji bendrija</h2>
            {!ivBetter && diff > 0 && (
              <span className="rounded-full bg-emerald-accent px-3 py-1 text-xs font-bold text-black">
                Apsimoka
              </span>
            )}
          </div>

          <div className="space-y-3">
            <Row label="Metinės pajamos" value={formatCurrency(mbResult.income)} />

            {/* Manager fee section */}
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Vadovo atlyginimas
              </div>
              <Row label={`Vadovo mokestis (iki 12 VDU)`} value={formatCurrency(mbResult.managerFee)} />
              <Row label="GPM (20%)" value={formatCurrency(mbResult.managerGPM)} negative small />
              <Row label="VSD (20,81%)" value={formatCurrency(mbResult.managerVSD)} negative small />
              <Row label="PSD (6,98%)" value={formatCurrency(mbResult.managerPSD)} negative small />
              <Row label="Vadovo grynasis" value={formatCurrency(mbResult.managerNet)} bold small />
            </div>

            {/* Corporate section */}
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Pelnas ir dividendai
              </div>
              <Row label="Pelnas prieš mokesčius" value={formatCurrency(mbResult.corporateProfit)} />
              <Row
                label={`Pelno mokestis (${firstTwoYears && annualIncome <= 300000 ? "0%" : annualIncome <= 300000 ? "7%" : "15%"})`}
                value={formatCurrency(mbResult.corporateTax)}
                negative
                small
              />
              <Row label="Dividendai" value={formatCurrency(mbResult.dividends)} small />
              <Row label="Dividendų mokestis (15%)" value={formatCurrency(mbResult.dividendTax)} negative small />
            </div>

            <Divider />
            <Row label="Visi mokesčiai" value={formatCurrency(mbResult.totalTax)} bold negative />
            <Row label="Mokestinė našta" value={formatPercent(mbResult.effectiveRate)} />
            <div className="rounded-xl bg-emerald-muted p-4">
              <Row label="Grynasis pelnas" value={formatCurrency(mbResult.netIncome)} bold highlight />
              <div className="mt-1 text-xs text-muted">
                {formatCurrency(mbResult.netIncome / 12)} / mėn.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-3 font-semibold">Svarbi informacija</h3>
        <ul className="space-y-2 text-sm text-muted">
          <li>IV skaičiavimas naudoja 30% standartinį sąnaudų atskaitymą.</li>
          <li>MB vadovo atlyginimas ribojamas iki 12 VDU (27 654 €/metus).</li>
          <li>MB pirmus 2 metus gali naudoti 0% pelno mokesčio tarifą (pajamos iki 300 000 €).</li>
          <li>MB turi papildomų administravimo kaštų (buhalterija, registracija), kurie čia neįskaičiuoti.</li>
          <li>Šis palyginimas yra supaprastintas — konsultuokitės su buhalteriu dėl individualios situacijos.</li>
        </ul>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  negative,
  highlight,
  muted,
  small,
}: {
  label: string;
  value: string;
  bold?: boolean;
  negative?: boolean;
  highlight?: boolean;
  muted?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${small ? "text-sm" : ""}`}>
      <span className={`${muted ? "text-muted" : ""} ${bold ? "font-semibold" : ""}`}>
        {label}
      </span>
      <span
        className={`${bold ? "text-lg font-bold" : "font-semibold"} ${
          highlight ? "text-emerald-accent" : negative ? "text-red-accent" : ""
        }`}
      >
        {negative && !highlight ? "−" : ""}{value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}
