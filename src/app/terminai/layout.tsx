import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mokesčių terminai ir kalendorius 2026 — Mano Veikla",
  description:
    "Individualios veiklos mokesčių terminai 2026 metams. GPM, VSD, PSD mokėjimo datos, priminimai ir kalendorius.",
  openGraph: {
    title: "Mokesčių terminai ir kalendorius 2026 — Mano Veikla",
    description:
      "Individualios veiklos mokesčių terminai 2026 metams. GPM, VSD, PSD mokėjimo datos, priminimai ir kalendorius.",
    url: "https://manoveikla.lt/terminai",
  },
};

export default function TerminaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
