"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { logoutAction } from "@/lib/actions";

const publicLinks = [
  { href: "/", label: "Pradžia" },
  { href: "/skaiciuokle", label: "Skaičiuoklė" },
  { href: "/palyginimas", label: "IV vs MB" },
  { href: "/terminai", label: "Terminai" },
];

const dashboardLinks = [
  { href: "/dashboard", label: "Suvestinė" },
  { href: "/dashboard/pajamos", label: "Pajamos" },
  { href: "/dashboard/sanaudos", label: "Sąnaudos" },
  { href: "/dashboard/nustatymai", label: "Nustatymai" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname.startsWith("/dashboard");
  const links = isDashboard ? dashboardLinks : publicLinks;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user session info on client
  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.name) setUserName(data.name);
        else setUserName(null);
      })
      .catch(() => setUserName(null));
  }, [pathname]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logoutAction();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={isDashboard ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-accent">
            <span className="text-sm font-bold text-black">MV</span>
          </div>
          <span className="text-lg font-semibold">Mano Veikla</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href) && link.href !== "/dashboard"
                  ? true
                  : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-muted text-emerald-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* User menu or login button */}
          {userName ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-muted text-xs font-bold text-emerald-accent">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{userName}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card py-1 shadow-xl">
                  {isDashboard ? (
                    <Link
                      href="/"
                      className="block px-4 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Viešos priemonės
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Mano suvestinė
                    </Link>
                  )}
                  <Link
                    href="/dashboard/nustatymai"
                    className="block px-4 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Nustatymai
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-accent hover:bg-card-hover"
                  >
                    Atsijungti
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/prisijungti"
              className="rounded-lg bg-emerald-accent px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-emerald-light"
            >
              Prisijungti
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-muted hover:text-foreground sm:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <nav className="border-t border-border px-4 py-3 sm:hidden">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-muted text-emerald-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
