import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mokesčių terminai 2026 — Mano Veikla",
  description:
    "Individualios veiklos mokesčių terminai 2026 metams. GPM avansai, Sodra įmokos, metinė deklaracija.",
};

interface Deadline {
  date: string;
  title: string;
  description: string;
  type: "gpm" | "sodra" | "declaration" | "pvm";
}

const deadlines: Deadline[] = [
  // Q1
  {
    date: "Sausio 15",
    title: "Sodra įmokos",
    description: "Mėnesinės VSD ir PSD įmokos už gruodį",
    type: "sodra",
  },
  {
    date: "Sausio 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už gruodį (jei PVM mokėtojas)",
    type: "pvm",
  },
  {
    date: "Vasario 15",
    title: "Sodra įmokos",
    description: "Mėnesinės VSD ir PSD įmokos už sausį",
    type: "sodra",
  },
  {
    date: "Vasario 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už sausį (jei PVM mokėtojas)",
    type: "pvm",
  },
  {
    date: "Kovo 15",
    title: "GPM avansas + Sodra",
    description: "I-ojo ketvirčio GPM avansinis mokėjimas ir Sodra įmokos už vasarį",
    type: "gpm",
  },
  {
    date: "Kovo 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už vasarį (jei PVM mokėtojas)",
    type: "pvm",
  },
  // Q2
  {
    date: "Balandžio 15",
    title: "Sodra įmokos",
    description: "Mėnesinės VSD ir PSD įmokos už kovą",
    type: "sodra",
  },
  {
    date: "Balandžio 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už kovą (jei PVM mokėtojas)",
    type: "pvm",
  },
  {
    date: "Gegužės 1",
    title: "Metinė deklaracija",
    description: "Metinės pajamų deklaracijos pateikimas už praėjusius metus",
    type: "declaration",
  },
  {
    date: "Gegužės 15",
    title: "Sodra įmokos",
    description: "Mėnesinės VSD ir PSD įmokos už balandį",
    type: "sodra",
  },
  {
    date: "Gegužės 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už balandį (jei PVM mokėtojas)",
    type: "pvm",
  },
  {
    date: "Birželio 15",
    title: "GPM avansas + Sodra",
    description: "II-ojo ketvirčio GPM avansinis mokėjimas ir Sodra įmokos už gegužę",
    type: "gpm",
  },
  {
    date: "Birželio 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už gegužę (jei PVM mokėtojas)",
    type: "pvm",
  },
  // Q3
  {
    date: "Liepos 15",
    title: "Sodra įmokos",
    description: "Mėnesinės VSD ir PSD įmokos už birželį",
    type: "sodra",
  },
  {
    date: "Liepos 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už birželį (jei PVM mokėtojas)",
    type: "pvm",
  },
  {
    date: "Rugpjūčio 15",
    title: "Sodra įmokos",
    description: "Mėnesinės VSD ir PSD įmokos už liepą",
    type: "sodra",
  },
  {
    date: "Rugpjūčio 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už liepą (jei PVM mokėtojas)",
    type: "pvm",
  },
  {
    date: "Rugsėjo 15",
    title: "GPM avansas + Sodra",
    description: "III-ojo ketvirčio GPM avansinis mokėjimas ir Sodra įmokos už rugpjūtį",
    type: "gpm",
  },
  {
    date: "Rugsėjo 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už rugpjūtį (jei PVM mokėtojas)",
    type: "pvm",
  },
  // Q4
  {
    date: "Spalio 15",
    title: "Sodra įmokos",
    description: "Mėnesinės VSD ir PSD įmokos už rugsėjį",
    type: "sodra",
  },
  {
    date: "Spalio 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už rugsėjį (jei PVM mokėtojas)",
    type: "pvm",
  },
  {
    date: "Lapkričio 15",
    title: "Sodra įmokos",
    description: "Mėnesinės VSD ir PSD įmokos už spalį",
    type: "sodra",
  },
  {
    date: "Lapkričio 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už spalį (jei PVM mokėtojas)",
    type: "pvm",
  },
  {
    date: "Gruodžio 15",
    title: "GPM avansas + Sodra",
    description: "IV-ojo ketvirčio GPM avansinis mokėjimas ir Sodra įmokos už lapkritį",
    type: "gpm",
  },
  {
    date: "Gruodžio 25",
    title: "PVM deklaracija",
    description: "PVM deklaracija už lapkritį (jei PVM mokėtojas)",
    type: "pvm",
  },
];

const typeConfig = {
  gpm: {
    color: "border-emerald-accent bg-emerald-muted text-emerald-accent",
    badge: "GPM",
    dot: "bg-emerald-accent",
  },
  sodra: {
    color: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    badge: "Sodra",
    dot: "bg-blue-400",
  },
  declaration: {
    color: "border-purple-500/20 bg-purple-500/10 text-purple-400",
    badge: "Deklaracija",
    dot: "bg-purple-400",
  },
  pvm: {
    color: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    badge: "PVM",
    dot: "bg-yellow-400",
  },
};

export default function DeadlinesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Mokesčių terminai 2026
        </h1>
        <p className="mt-2 text-muted">
          Individualios veiklos mokesčių kalendorius
        </p>
      </div>

      {/* Legend */}
      <div className="mb-8 flex flex-wrap gap-3">
        {Object.entries(typeConfig).map(([key, config]) => (
          <div
            key={key}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5"
          >
            <div className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
            <span className="text-sm text-muted">{config.badge}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative space-y-3">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border sm:left-[23px]" />

        {deadlines.map((deadline, i) => {
          const config = typeConfig[deadline.type];
          return (
            <div key={i} className="relative flex gap-4 sm:gap-5">
              <div className="relative z-10 mt-2 flex h-[10px] w-[10px] shrink-0 items-center justify-center sm:h-[12px] sm:w-[12px]">
                <div
                  className={`h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3 ${config.dot}`}
                />
              </div>
              <div className="flex-1 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card-hover">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{deadline.title}</h3>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs font-medium ${config.color}`}
                      >
                        {config.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {deadline.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-muted">
                    {deadline.date}
                  </span>
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
            PVM deklaracija aktuali tik PVM mokėtojams (pajamos viršija
            45 000 € per metus).
          </li>
          <li>
            Sodra (VSD + PSD) įmokos mokamos kas mėnesį iki 15 dienos
            už praėjusį mėnesį.
          </li>
        </ul>
      </div>
    </div>
  );
}
