import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
      </svg>
    ),
    title: "Tikslūs skaičiavimai",
    description:
      "GPM, VSD, PSD mokesčiai pagal naujausius 2026 m. tarifus. Progresinis GPM, Sodra lubos, minimalus PSD — viskas įskaičiuota.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Realiu laiku",
    description:
      "Matyk mokesčius iš karto keičiant pajamas. Be jokių apribojimų, be registracijos — tiesiog veikia.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
      </svg>
    ),
    title: "Mokesčių terminai",
    description:
      "Niekada nepraleisk mokesčių terminų. GPM avansai, Sodra įmokos, metinė deklaracija — viskas vienoje vietoje.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-emerald-border bg-emerald-muted px-4 py-1.5 text-sm text-emerald-accent">
              2026 m. mokesčių tarifai
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Valdyk savo{" "}
              <span className="text-emerald-accent">individualią veiklą</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
              Žinok savo mokesčius realiu laiku. Nemokama skaičiuoklė su
              GPM, VSD ir PSD skaičiavimais pagal naujausius 2026 m. tarifus.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/skaiciuokle"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-accent px-8 text-base font-semibold text-black transition-all hover:bg-emerald-light hover:shadow-[0_0_24px_rgba(16,185,129,0.3)]"
              >
                Pradėti nemokamai
              </Link>
              <Link
                href="/terminai"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-8 text-base font-medium text-muted transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                Mokesčių terminai
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Viskas ko reikia individualiai veiklai
            </h2>
            <p className="mt-3 text-muted">
              Paprastas ir patikimas įrankis mokesčių planavimui
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-card-hover"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-muted text-emerald-accent">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-2xl border border-emerald-border bg-emerald-muted p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Pasiruošęs sužinoti savo mokesčius?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              Jokios registracijos, jokių apribojimų. Tiesiog įvesk savo
              pajamas ir gauk tikslų mokesčių paskaičiavimą.
            </p>
            <Link
              href="/skaiciuokle"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-emerald-accent px-8 text-base font-semibold text-black transition-all hover:bg-emerald-light hover:shadow-[0_0_24px_rgba(16,185,129,0.3)]"
            >
              Atidaryti skaičiuoklę
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
