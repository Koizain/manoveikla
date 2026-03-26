import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Mano Veikla",
      url: "https://manoveikla.lt",
      description:
        "Nemokama individualios veiklos mokesčių skaičiuoklė 2026 metams. GPM, VSD, PSD — sužinok savo mokesčius realiu laiku.",
      inLanguage: "lt",
    },
    {
      "@type": "SoftwareApplication",
      name: "Mano Veikla — Mokesčių skaičiuoklė",
      url: "https://manoveikla.lt",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
      },
      description:
        "Nemokama individualios veiklos mokesčių skaičiuoklė Lietuvai. Apskaičiuok GPM, VSD, PSD mokesčius 2026 metams.",
      inLanguage: "lt",
    },
  ],
};

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
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          strategy="afterInteractive"
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
