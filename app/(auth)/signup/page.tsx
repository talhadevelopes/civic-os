"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type Role = "CITIZEN" | "AUTHORITY";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("CITIZEN");
  const [authorityCode, setAuthorityCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        authorityCode: role === "AUTHORITY" ? authorityCode : undefined,
      }),
    });

    const data = (await res.json().catch(() => null)) as { error?: string } | null;

    if (!res.ok) {
      setLoading(false);
      setError(data?.error ?? "Signup failed");
      return;
    }

    const signInRes = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (!signInRes || signInRes.error) {
      window.location.href = "/login";
      return;
    }

    window.location.href = signInRes.url ?? "/dashboard";
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto flex max-w-md flex-col px-4 pt-16 sm:px-6">
        <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-heading)" }}>
            Create account
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-body)" }}>
            Join CIVICOS to report issues and track verified fixes.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              Full name
              <input
                className="h-11 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                suppressHydrationWarning
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmed Khan"
                required
              />
            </label>

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
              Role
              <select
                className="h-11 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="CITIZEN">Citizen</option>
                <option value="AUTHORITY">Authority</option>
              </select>
            </label>

            {role === "AUTHORITY" ? (
              <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                Authority verification code
                <input
                  className="h-11 rounded-xl border px-3 text-sm outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  suppressHydrationWarning
                  value={authorityCode}
                  onChange={(e) => setAuthorityCode(e.target.value)}
                  placeholder="GHMC-2024"
                  required
                />
              </label>
            ) : null}

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

            <label className="grid gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
              Confirm password
              <input
                className="h-11 rounded-xl border px-3 text-sm outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                type="password"
                suppressHydrationWarning
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-sm" style={{ color: "var(--text-body)" }}>
            Already have an account?{" "}
            <a className="font-medium" style={{ color: "var(--text-green)" }} href="/login">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}