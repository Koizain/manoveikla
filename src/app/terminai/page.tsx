"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { calculateTaxes, formatCurrency, TAX_CONSTANTS_2026, type TaxOptions } from "@/lib/tax";
import { GPM_DEADLINES } from "@/lib/deadlines";
import { parseMonthlyIncomes } from "@/lib/storage";

const TRACKER_KEY = "manoveikla-tracker";

interface Deadline {
  title: string;
  description: string;
  type: "gpm" | "sodra" | "declaration" | "pvm";
  getDate: (year: number) => Date;
  getAmount?: (annualIncome: number, options: TaxOptions) => number | null;
}

const deadlineTemplates: Deadline[] = [
  // GPM quarterly
  ...GPM_DEADLINES.map(({ month, day }, index) => ({
    title: `GPM avansas (${index + 1} ketv.)`,
    description: `${index + 1}-ojo ketvirčio GPM avansinis mokėjimas`,
    type: "gpm" as const,
    getDate: (year: number) => new Date(year, month, day),
    getAmount: (annualIncome: number, options: TaxOptions) => {
      const result = calculateTaxes(annualIncome, options);
      return result.gpm / 4;
    },
  })),
  // Sodra monthly (15th)
  ...Array.from({ length: 12 }, (_, i) => {
    const monthNames = [
      "sausį", "vasarį", "kovą", "balandį", "gegužę", "birželį",
      "liepą", "rugpjūtį", "rugsėjį", "spalį", "lapkritį", "gruodį",
    ];
    return {
      title: "Sodra įmokos",
      description: `Mėnesinės VSD ir PSD įmokos už ${monthNames[i === 0 ? 11 : i - 1]}`,
      type: "sodra" as const,
      getDate: (year: number) => new Date(year, i, 15),
      getAmount: (annualIncome: number, options: TaxOptions) => {
        const result = calculateTaxes(annualIncome, options);
        return (result.vsd + result.psd) / 12;
      },
    };
  }),
  // Annual declaration - May 1
  {
    title: "Metinė deklaracija",
    description: "Metinės pajamų deklaracijos pateikimas už praėjusius metus",
    type: "declaration" as const,
    getDate: (year: number) => new Date(year, 4, 1),
  },
  // PVM monthly 25th (only shown if income near 45K)
  ...Array.from({ length: 12 }, (_, i) => {
    const monthNames = [
      "gruodį", "sausį", "vasarį", "kovą", "balandį", "gegužę",
      "birželį", "liepą", "rugpjūtį", "rugsėjį", "spalį", "lapkritį",
    ];
    return {
      title: "PVM deklaracija",
      description: `PVM deklaracija už ${monthNames[i]} (jei PVM mokėtojas)`,
      type: "pvm" as const,
      getDate: (year: number) => new Date(year, i, 25),
      getAmount: () => null,
    };
  }),
];

const typeConfig = {
  gpm: {
    color: "border-emerald-accent/30 bg-emerald-accent/10 text-emerald-accent",
    badge: "GPM",
    dot: "bg-emerald-accent",
  },
  sodra: {
    color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    badge: "Sodra",
    dot: "bg-blue-400",
  },
  declaration: {
    color: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    badge: "Deklaracija",
    dot: "bg-purple-400",
  },
  pvm: {
    color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    badge: "PVM",
    dot: "bg-yellow-400",
  },
};

function formatLithuanianDate(date: Date): string {
  const months = [
    "sausio", "vasario", "kovo", "balandžio", "gegužės", "birželio",
    "liepos", "rugpjūčio", "rugsėjo", "spalio", "lapkričio", "gruodžio",
  ];
  return `${date.getFullYear()} ${months[date.getMonth()]} ${date.getDate()} d.`;
}

function getDaysLeft(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusColor(daysLeft: number): string {
  if (daysLeft < 0) return "border-l-zinc-500";
  if (daysLeft < 7) return "border-l-red-accent";
  if (daysLeft <= 30) return "border-l-yellow-accent";
  return "border-l-emerald-accent";
}

function getCountdownText(daysLeft: number): { text: string; className: string } {
  if (daysLeft < 0) return { text: `Praėjo prieš ${Math.abs(daysLeft)} d.`, className: "text-zinc-500" };
  if (daysLeft === 0) return { text: "Šiandien!", className: "text-red-accent font-bold" };
  if (daysLeft === 1) return { text: "Rytoj!", className: "text-red-accent font-bold" };
  if (daysLeft < 7) return { text: `Liko ${daysLeft} d.`, className: "text-red-accent font-semibold" };
  if (daysLeft <= 30) return { text: `Liko ${daysLeft} d.`, className: "text-yellow-accent" };
  return { text: `Liko ${daysLeft} d.`, className: "text-emerald-accent" };
}

function formatICSDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function generateUID(date: Date, title: string): string {
  return `${formatICSDate(date)}-${title.replace(/\s+/g, "-").toLowerCase()}@manoveikla.lt`;
}

type FilterType = "all" | "gpm" | "sodra" | "declaration" | "pvm";

export default function DeadlinesPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [annualIncome, setAnnualIncome] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const months = parseMonthlyIncomes(localStorage.getItem(TRACKER_KEY));
    setAnnualIncome(months.reduce((a, b) => a + b, 0));
    setMounted(true);
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);
  const showPVM = annualIncome >= TAX_CONSTANTS_2026.PVM_THRESHOLD * 0.7;

  const options: TaxOptions = useMemo(
    () => ({
      expenseMethod: "30percent",
      actualExpenses: 0,
      additionalPension: false,
      employedElsewhere: false,
    }),
    []
  );

  const deadlines = useMemo(() => {
    const items = deadlineTemplates
      .filter((d) => d.type !== "pvm" || showPVM)
      .flatMap((template) => {
        // Generate for current year and next year
        return [year, year + 1].map((y) => {
          const date = template.getDate(y);
          const daysLeft = getDaysLeft(date);
          const amount = template.getAmount ? template.getAmount(annualIncome, options) : null;
          return {
            ...template,
            date,
            daysLeft,
            amount,
          };
        });
      })
      .filter((d) => d.daysLeft >= -30) // Show past 30 days
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Take past items + next 20 upcoming
    const past = items.filter((d) => d.daysLeft < 0);
    const future = items.filter((d) => d.daysLeft >= 0).slice(0, 20);
    return [...past, ...future];
  }, [year, showPVM, annualIncome, options]);

  const filtered = filter === "all" ? deadlines : deadlines.filter((d) => d.type === filter);

  const handleExportICS = useCallback(() => {
    const events = deadlines
      .filter((d) => d.daysLeft >= 0)
      .map((d) => {
        const dtStart = formatICSDate(d.date);
        const dtEnd = formatICSDate(new Date(d.date.getTime() + 86400000));
        const alarmDate = new Date(d.date);
        alarmDate.setDate(alarmDate.getDate() - 3);
        const uid = generateUID(d.date, d.title);
        return [
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `DTSTART;VALUE=DATE:${dtStart}`,
          `DTEND;VALUE=DATE:${dtEnd}`,
          `SUMMARY:Mokesčių terminas: ${d.title}`,
          `DESCRIPTION:${d.description}`,
          "BEGIN:VALARM",
          "TRIGGER:-P3D",
          "ACTION:DISPLAY",
          `DESCRIPTION:Mokesčių terminas: ${d.title} po 3 dienų`,
          "END:VALARM",
          "END:VEVENT",
        ].join("\r\n");
      });

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//manoveikla.lt//Mokesčių terminai//LT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mokesciu-terminai-${year}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [deadlines, year]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Mokesčių terminai
        </h1>
        <p className="mt-2 text-muted">
          Artimiausi mokesčių terminai — surikiuoti pagal datą
        </p>
      </div>

      {/* iCal Export */}
      <div className="mb-6">
        <button
          onClick={handleExportICS}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted transition-all hover:border-foreground/20 hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Eksportuoti į kalendorių (.ics)
        </button>
      </div>

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {([
          { key: "all", label: "Visi" },
          { key: "gpm", label: "GPM" },
          { key: "sodra", label: "Sodra" },
          { key: "declaration", label: "Deklaracija" },
          ...(showPVM ? [{ key: "pvm", label: "PVM" }] : []),
        ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filter === key
                ? "bg-emerald-accent text-black"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Income context notice */}
      {mounted && annualIncome > 0 && (
        <div className="mb-6 rounded-xl border border-emerald-border bg-emerald-muted/30 p-4 text-sm text-muted">
          Sumos skaičiuojamos pagal jūsų metinės apskaitos duomenis: {formatCurrency(annualIncome)} metinės pajamos.
        </div>
      )}

      {/* Deadline Cards */}
      <div className="space-y-3">
        {filtered.map((deadline, i) => {
          const config = typeConfig[deadline.type];
          const statusColor = getStatusColor(deadline.daysLeft);
          const countdown = getCountdownText(deadline.daysLeft);
          const isPast = deadline.daysLeft < 0;

          return (
            <div
              key={`${deadline.type}-${deadline.date.getTime()}-${i}`}
              className={`rounded-xl border border-border border-l-4 ${statusColor} bg-card p-4 transition-colors hover:bg-card-hover ${
                isPast ? "opacity-50" : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`font-semibold ${isPast ? "text-muted" : ""}`}>
                      {deadline.title}
                    </h3>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-medium ${config.color}`}
                    >
                      {config.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{deadline.description}</p>
                </div>

                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                  <div className="text-sm font-medium text-muted">
                    {formatLithuanianDate(deadline.date)}
                  </div>
                  <div className={`text-sm ${countdown.className}`}>
                    {countdown.text}
                  </div>
                  {deadline.amount !== null && deadline.amount > 0 && annualIncome > 0 && !isPast && (
                    <div className="text-sm font-semibold text-emerald-accent">
                      ~{formatCurrency(deadline.amount)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-3 font-semibold">Svarbi informacija</h3>
        <ul className="space-y-2 text-sm text-muted">
          <li>
            Jeigu termino diena yra nedarbo diena, terminas nukeliamas
            į artimiausią darbo dieną.
          </li>
          <li>
            GPM avansai mokami kas ketvirtį: kovo 15, birželio 15,
            rugsėjo 15 ir gruodžio 15 dienomis.
          </li>
          <li>
            PVM deklaracija rodoma tik kai metinės pajamos artėja prie
            45 000 € ribos.
          </li>
          <li>
            Sodra (VSD + PSD) įmokos mokamos kas mėnesį iki 15 dienos
            už praėjusį mėnesį.
          </li>
          <li>
            Sumos yra orientacinės ir skaičiuojamos pagal metinės apskaitos duomenis.
          </li>
        </ul>
      </div>
    </div>
  );
}
