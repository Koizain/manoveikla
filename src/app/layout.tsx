import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mano Veikla — Individualios veiklos mokesčių skaičiuoklė 2026",
  description:
    "Nemokama individualios veiklos mokesčių skaičiuoklė 2026 metams. GPM, VSD, PSD — sužinok savo mokesčius realiu laiku.",
  keywords: [
    "individuali veikla",
    "mokesčių skaičiuoklė",
    "GPM",
    "VSD",
    "PSD",
    "Sodra",
    "VMI",
    "2026",
    "mokesčiai",
    "freelancer",
    "Lietuva",
  ],
  authors: [{ name: "manoveikla.lt" }],
  openGraph: {
    title: "Mano Veikla — Individualios veiklos mokesčių skaičiuoklė 2026",
    description:
      "Nemokama individualios veiklos mokesčių skaičiuoklė 2026 metams. GPM, VSD, PSD — sužinok savo mokesčius realiu laiku.",
    url: "https://manoveikla.lt",
    siteName: "Mano Veikla",
    locale: "lt_LT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
