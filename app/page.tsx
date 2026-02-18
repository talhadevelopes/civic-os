import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers, MapPin, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [
    totalReports,
    confirmedFixed,
    mlaCount,
    avgResolution,
    userCount,
  ] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: "CONFIRMED_FIXED" } }),
    prisma.report.groupBy({
      by: ["constituencyName"],
      where: { constituencyName: { not: null } },
    }).then((g) => g.length),
    prisma.report
      .findMany({
        where: { status: "CONFIRMED_FIXED" },
        select: { createdAt: true, updatedAt: true },
      })
      .then((reports) => {
        if (reports.length === 0) return null;
        const avg =
          reports.reduce((sum, r) => {
            return sum + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / reports.length;
        return avg.toFixed(1);
      }),
    prisma.user.count(),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-10 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold"
              style={{ background: "var(--primary)", color: "var(--text-on-primary)" }}
            >
              C
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                CIVICOS
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Civic accountability, tracked live
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border px-4 py-2 text-sm transition"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                background: "var(--surface)",
              }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full px-4 py-2 text-sm font-medium shadow-sm transition"
              style={{
                background: "var(--primary)",
                color: "var(--text-on-primary)",
                boxShadow: "var(--shadow-green)",
              }}
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pt-10 pb-8 sm:px-6">
          <div
            className="rounded-3xl border p-5 sm:p-8"
            style={{ borderColor: "var(--border-green)", background: "var(--primary-light)" }}
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                  style={{
                    background: "var(--primary-mint)",
                    borderColor: "var(--primary-border)",
                    color: "var(--text-green-dark)",
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verified accountability layer for cities
                </div>

                <h1
                  className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl"
                  style={{ color: "var(--text-heading)" }}
                >
                  Track civic complaints like an Amazon order.
                </h1>

                <p className="mt-4 max-w-xl text-base leading-7" style={{ color: "var(--text-body)" }}>
                  CIVICOS connects citizens, municipal authorities, and MLAs on one transparent timeline —
                  from report to verified fix.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/reports/new"
                    className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-sm transition"
                    style={{
                      background: "var(--primary)",
                      color: "var(--text-on-primary)",
                      boxShadow: "var(--shadow-green)",
                    }}
                  >
                    Report an Issue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                      background: "var(--surface)",
                    }}
                  >
                    View Dashboard
                  </Link>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                    <CheckCircle2 className="h-4 w-4" style={{ color: "var(--text-green)" }} />
                    Immutable audit trail
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                    <MapPin className="h-4 w-4" style={{ color: "var(--text-green)" }} />
                    GPS-based assignment
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
                    <Layers className="h-4 w-4" style={{ color: "var(--text-green)" }} />
                    Zones • Heat • Pins
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <div
                  className="rounded-xl border p-5"
                  style={{ borderColor: "var(--border-green)", background: "var(--surface-stats)" }}
                >
                  <div className="text-sm" style={{ color: "var(--text-stats-label)" }}>
                    Live platform snapshot
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-semibold" style={{ color: "var(--text-stats)" }}>
                        {totalReports}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-green-dark)" }}>
                        Issues reported
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold" style={{ color: "var(--text-stats)" }}>
                        {confirmedFixed}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-green-dark)" }}>
                        Confirmed fixed
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold" style={{ color: "var(--text-stats)" }}>
                        {mlaCount}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-green-dark)" }}>
                        MLAs tracked
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold" style={{ color: "var(--text-stats)" }}>
                        {avgResolution ?? "—"}
                        {avgResolution ? "d" : ""}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-green-dark)" }}>
                        Avg resolution
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      How it works
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["Report", "Assign", "Fix", "Verify", "Done"].map((s) => (
                        <span
                          key={s}
                          className="rounded-full border px-3 py-1 text-[11px] font-medium"
                          style={{
                            background: "var(--primary-mint)",
                            borderColor: "var(--primary-border)",
                            color: "var(--text-green-dark)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Report", desc: "Drop a pin, add a photo, submit in seconds.", Icon: MapPin },
              { title: "Track", desc: "Every action is logged in an immutable timeline.", Icon: Layers },
              { title: "Verify", desc: "Citizens confirm the fix — performance scores update live.", Icon: CheckCircle2 },
            ].map(({ title, desc, Icon }) => (
              <div
                key={title}
                className="rounded-2xl border p-6"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    background: "var(--surface-tint)",
                    borderColor: "var(--border-green)",
                    color: "var(--text-green)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {title}
                </div>
                <div className="mt-2 text-sm leading-6" style={{ color: "var(--text-body)" }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8 sm:px-6">
            <div className="text-sm" style={{ color: "var(--text-body)" }}>
              Team Reformers | CIVICOS
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Hyderabad first. Built to scale across India.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
