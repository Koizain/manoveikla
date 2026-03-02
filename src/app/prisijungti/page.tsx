"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-accent">
            <span className="text-lg font-bold text-black">MV</span>
          </div>
          <h1 className="text-2xl font-bold">Prisijungimas</h1>
          <p className="mt-2 text-sm text-muted">
            Prisijunkite prie savo darbo erdvės
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-accent/30 bg-red-accent/10 p-3 text-sm text-red-accent">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              El. paštas
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-accent"
              placeholder="jusu@email.lt"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Slaptažodis
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-accent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-accent py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-light disabled:opacity-50"
          >
            {loading ? "Jungiamasi..." : "Prisijungti"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Neturite paskyros?{" "}
          <Link href="/registracija" className="text-emerald-accent hover:text-emerald-light">
            Registruotis
          </Link>
        </p>
      </div>
    </div>
  );
}
