import Link from "next/link";
import { getMlaStatsFromReports } from "@/lib/mlaStats";
import { Building2, Search, Shield } from "lucide-react";

const MUNICIPAL_BODIES = [
  { name: "GHMC", fullName: "Greater Hyderabad Municipal Corporation" },
  { name: "Hyderabad Metro Water", fullName: "HMWSSB" },
  { name: "TSSPDCL", fullName: "Telangana State Southern Power Distribution" },
];

export default async function AuthoritiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = String(q).trim().toLowerCase();

  const mlas = await getMlaStatsFromReports();
  const filtered = query
    ? mlas.filter(
        (m) =>
          m.mlaName.toLowerCase().includes(query) ||
          m.constituency.toLowerCase().includes(query)
      )
    : mlas;

  const sorted = [...filtered].sort((a, b) => b.resolutionRate - a.resolutionRate);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "#eff6ff", color: "#2563eb" }}
          >
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1
              className="text-3xl font-semibold"
              style={{ color: "var(--text-heading)" }}
            >
              Authorities & MLAs
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-body)" }}>
              Government bodies and MLA performance overview
            </p>
          </div>
        </div>

        <div
          className="mt-8 rounded-2xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Municipal Bodies
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {MUNICIPAL_BODIES.map((body) => (
              <div
                key={body.name}
                className="rounded-xl border p-4"
                style={{
                  background: "var(--primary-light)",
                  borderColor: "var(--border-green)",
                }}
              >
                <Shield className="h-5 w-5" style={{ color: "var(--primary)" }} />
                <p
                  className="mt-2 font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {body.name}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {body.fullName}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-8 rounded-2xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              MLAs Being Tracked
            </h2>
            <form
              action="/authorities"
              method="get"
              className="relative flex-1 sm:max-w-xs"
            >
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by name or ward..."
                className="h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              />
            </form>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.length === 0 ? (
              <p className="col-span-full text-center text-sm" style={{ color: "var(--text-muted)" }}>
                {query ? "No MLAs match your search." : "No MLA data yet."}
              </p>
            ) : (
              sorted.map((mla) => (
                <Link
                  key={`${mla.mlaName}-${mla.constituency}`}
                  href={`/authorities/mla/${mla.slug}`}
                  className="rounded-xl border p-4 transition hover:border-green-300"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "#eff6ff", color: "#2563eb" }}
                  >
                    <span className="text-lg font-bold">
                      {mla.mlaName.charAt(0)}
                    </span>
                  </div>
                  <p
                    className="mt-3 font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {mla.mlaName}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {mla.constituency}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span style={{ color: "var(--text-body)" }}>
                      Resolution:{" "}
                      <strong style={{ color: "var(--primary)" }}>
                        {mla.resolutionRate.toFixed(0)}%
                      </strong>
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {mla.confirmedFixed} fixed
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
