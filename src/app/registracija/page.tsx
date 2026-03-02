"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { registerAction } from "@/lib/actions";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const inviteEmail = searchParams.get("email") || "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (inviteToken) {
      formData.set("invite", inviteToken);
    }
    const result = await registerAction(formData);

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
          <h1 className="text-2xl font-bold">Registracija</h1>
          <p className="mt-2 text-sm text-muted">
            {inviteToken
              ? "Prisijunkite prie komandos"
              : "Sukurkite savo darbo erdvę"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-accent/30 bg-red-accent/10 p-3 text-sm text-red-accent">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Vardas
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-accent"
              placeholder="Jonas Jonaitis"
            />
          </div>

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
              defaultValue={inviteEmail}
              readOnly={!!inviteEmail}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-accent read-only:opacity-60"
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
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-accent"
              placeholder="Mažiausiai 6 simboliai"
            />
          </div>

          {!inviteToken && (
            <div>
              <label htmlFor="workspace" className="mb-1.5 block text-sm font-medium">
                Darbo erdvės pavadinimas
              </label>
              <input
                id="workspace"
                name="workspace"
                type="text"
                required={!inviteToken}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-accent"
                placeholder="pvz. Jonas IV"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-accent py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-light disabled:opacity-50"
          >
            {loading ? "Kuriama..." : "Registruotis"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Jau turite paskyrą?{" "}
          <Link href="/prisijungti" className="text-emerald-accent hover:text-emerald-light">
            Prisijungti
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-muted">Kraunama...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
