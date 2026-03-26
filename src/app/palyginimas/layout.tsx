import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IV vs MB palyginimas 2026 — Mano Veikla",
  description:
    "Palygink individualios veiklos ir mažosios bendrijos mokesčius 2026 metais. Sužinok, kas labiau apsimoka pagal tavo pajamas.",
  openGraph: {
    title: "IV vs MB palyginimas 2026 — Mano Veikla",
    description:
      "Palygink individualios veiklos ir mažosios bendrijos mokesčius 2026 metais. Sužinok, kas labiau apsimoka pagal tavo pajamas.",
    url: "https://manoveikla.lt/palyginimas",
  },
};

export default function PalyginimasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
