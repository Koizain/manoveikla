import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mokesčių skaičiuoklė 2026 — Mano Veikla",
  description:
    "Nemokama individualios veiklos mokesčių skaičiuoklė 2026 metams. Apskaičiuok GPM, VSD, PSD mokesčius realiu laiku.",
  openGraph: {
    title: "Mokesčių skaičiuoklė 2026 — Mano Veikla",
    description:
      "Nemokama individualios veiklos mokesčių skaičiuoklė 2026 metams. Apskaičiuok GPM, VSD, PSD mokesčius realiu laiku.",
    url: "https://manoveikla.lt/skaiciuokle",
  },
};

export default function SkaiciuokleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
