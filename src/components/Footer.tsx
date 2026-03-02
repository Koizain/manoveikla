import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-accent">
                <span className="text-sm font-bold text-black">MV</span>
              </div>
              <span className="text-lg font-semibold">Mano Veikla</span>
            </div>
            <p className="mt-3 text-sm text-muted">
              Nemokama individualios veiklos mokesčių skaičiuoklė 2026 metams.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              Navigacija
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  Pradžia
                </Link>
              </li>
              <li>
                <Link
                  href="/skaiciuokle"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  Skaičiuoklė
                </Link>
              </li>
              <li>
                <Link
                  href="/palyginimas"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  IV vs MB palyginimas
                </Link>
              </li>
              <li>
                <Link
                  href="/terminai"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  Terminai
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              Informacija
            </h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted">
                  Mokesčių tarifai: 2026 m.
                </span>
              </li>
              <li>
                <span className="text-sm text-muted">
                  Šaltinis: VMI, Sodra
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted">
          © {new Date().getFullYear()} manoveikla.lt — Individualios veiklos
          mokesčių skaičiuoklė
        </div>
      </div>
    </footer>
  );
}
