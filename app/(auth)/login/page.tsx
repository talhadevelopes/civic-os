"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mlas, setMlas] = useState<{ id: string; name: string; constituency: string }[]>([]);
  const [selectedMlaName, setSelectedMlaName] = useState("");
  const [mlaSearch, setMlaSearch] = useState("");

  const demoCitizen = { email: "ahmed.khan@gmail.com", password: "password123" };

  useEffect(() => {
    const url = new URL(window.location.href);
    setCallbackUrl(url.searchParams.get("callbackUrl") ?? "/dashboard");

    // Fetch MLAs for dropdown
    fetch("/api/mlas")
      .then((res) => res.json())
      .then((data) => setMlas(data))
      .catch(() => {});
  }, []);

  async function handleMlaLogin() {
    if (!selectedMlaName) return;
    setError(null);
    setLoading(true);

    // We use a special "MLA" email format that the system will recognize as an MLA login
    const mlaEmail = `mla.${selectedMlaName.toLowerCase().replace(/\s+/g, ".")}@civicos.demo`;

    const res = await signIn("credentials", {
      redirect: false,
      email: mlaEmail,
      password: "password123", // Default demo password
      callbackUrl,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Failed to login as MLA");
      return;
    }

    window.location.href = res.url ?? callbackUrl;
  }

  async function handleDemoLogin(role: "citizen") {
    setError(null);
    setLoading(true);

    const creds = demoCitizen;
    setEmail(creds.email);
    setPassword(creds.password);

    const res = await signIn("credentials", {
      redirect: false,
      email: creds.email,
      password: creds.password,
      callbackUrl,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Invalid email or password");
      return;
    }

    window.location.href = res.url ?? callbackUrl;
  }

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

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1" style={{ background: "var(--border)" }}></div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-body)" }}>
              Or demo access
            </span>
            <div className="h-px flex-1" style={{ background: "var(--border)" }}></div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <button
              onClick={() => handleDemoLogin("citizen")}
              disabled={loading}
              className="flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-all hover:opacity-80"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-heading)" }}
            >
              Continue as Demo Citizen
            </button>

            <div className="relative grid gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search & Select MLA..."
                  className="h-11 flex-1 rounded-xl border px-3 text-sm outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  value={mlaSearch}
                  onChange={(e) => setMlaSearch(e.target.value)}
                />
                <button
                  onClick={handleMlaLogin}
                  disabled={loading || !selectedMlaName}
                  className="h-11 rounded-xl px-4 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--primary)", color: "var(--text-on-primary)" }}
                >
                  Login as MLA
                </button>
              </div>

              {mlaSearch && (
                <div
                  className="absolute top-12 z-20 w-full max-h-48 overflow-y-auto rounded-xl border p-1 shadow-lg"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  {mlas
                    .filter((m) => m.name.toLowerCase().includes(mlaSearch.toLowerCase()) || m.constituency.toLowerCase().includes(mlaSearch.toLowerCase()))
                    .map((m) => (
                      <button
                        key={m.id}
                        className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-slate-100 transition-colors"
                        onClick={() => {
                          setSelectedMlaName(m.name);
                          setMlaSearch(m.name);
                        }}
                      >
                        <div className="font-medium">{m.name}</div>
                        <div className="text-[10px] text-slate-500">{m.constituency}</div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

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