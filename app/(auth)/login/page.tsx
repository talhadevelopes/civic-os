"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    setCallbackUrl(url.searchParams.get("callbackUrl") ?? "/dashboard");
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Invalid email or password");
      return;
    }

    window.location.href = res.url ?? callbackUrl;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto flex max-w-md flex-col px-4 pt-16 sm:px-6">
        <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-heading)" }}>
            Login
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-body)" }}>
            Sign in to CIVICOS to track and manage civic issues.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              Email
              <input
                className="h-11 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                type="email"
                suppressHydrationWarning
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              Password
              <input
                className="h-11 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                type="password"
                suppressHydrationWarning
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            {error ? (
              <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#fca5a5", background: "#fef2f2", color: "#dc2626" }}>
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium"
              style={{ background: "var(--primary)", color: "var(--text-on-primary)", boxShadow: "var(--shadow-green)" }}
              suppressHydrationWarning
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-5 text-sm" style={{ color: "var(--text-body)" }}>
            Don&apos;t have an account?{" "}
            <a className="font-medium" style={{ color: "var(--text-green)" }} href="/signup">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}