"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Tap {
  id: string;
  ipAddress: string;
  tappedAt: string;
  tag: {
    tagSlug: string;
    user: {
      email: string;
      profile: { firstName: string; lastName: string } | null;
    };
  };
}

interface TopTag {
  tagSlug: string;
  _count: { taps: number };
  user: { email: string; profile: { firstName: string; lastName: string } | null };
}

interface ReportData {
  daily: { date: string; count: number }[];
  taps: Tap[];
  total: number;
  topTags: TopTag[];
  pages: number;
}

const RANGES = [
  { label: "Today", value: "1" },
  { label: "7 Days", value: "7" },
  { label: "30 Days", value: "30" },
  { label: "90 Days", value: "90" },
  { label: "All time", value: "all" },
];

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [range, setRange] = useState("7");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  function load(r: string, p: number) {
    setLoading(true);
    fetch(`/api/admin/reports?range=${r}&page=${p}`)
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); });
  }

  useEffect(() => { load(range, page); }, [range, page]);

  function changeRange(r: string) {
    setRange(r);
    setPage(1);
  }

  const totalInRange = data?.total ?? 0;
  const avgPerDay = data?.daily.length
    ? Math.round((data.daily.reduce((s, d) => s + d.count, 0) / data.daily.length) * 10) / 10
    : 0;
  const maxDay = data?.daily.reduce((a, b) => (b.count > a.count ? b : a), { date: "", count: 0 });

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">NFC Tap Reports</h1>
          <p className="text-nfc-muted text-sm mt-1">Track how often your tags are being scanned</p>
        </div>
        <div className="flex gap-2 bg-white border border-nfc-border rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => changeRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                range === r.value ? "bg-nfc-red text-white" : "text-nfc-muted hover:text-nfc-dark"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-nfc-muted text-sm">Loading reports…</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            <div className="bg-nfc-red rounded-2xl p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1" style={{ fontFamily: "Space Mono, monospace" }}>
                TOTAL TAPS
              </p>
              <p className="text-4xl font-extrabold">{totalInRange}</p>
              <p className="text-xs text-white/60 mt-1">In selected period</p>
            </div>
            <div className="bg-white rounded-2xl border border-nfc-border p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-nfc-muted mb-1" style={{ fontFamily: "Space Mono, monospace" }}>AVG PER DAY</p>
              <p className="text-4xl font-extrabold text-nfc-dark">{avgPerDay}</p>
              <p className="text-xs text-nfc-subtle mt-1">Daily average</p>
            </div>
            <div className="bg-white rounded-2xl border border-nfc-border p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-nfc-muted mb-1" style={{ fontFamily: "Space Mono, monospace" }}>PEAK DAY</p>
              <p className="text-4xl font-extrabold text-nfc-dark">{maxDay?.count ?? 0}</p>
              <p className="text-xs text-nfc-subtle mt-1">{maxDay?.date || "—"}</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-nfc-border p-6">
              <h2 className="font-bold text-nfc-dark mb-5 text-sm flex items-center gap-2">
                <span className="w-2 h-4 rounded-full bg-nfc-red inline-block"></span>
                Bar Chart — Taps per Day
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data!.daily} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e4df" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "Space Mono, monospace", fill: "#8a857c" }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "Space Mono, monospace", fill: "#8a857c" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7e4df", fontFamily: "Archivo", fontSize: 12 }} formatter={(v) => [`${v}`, "Taps"]} />
                  <Bar dataKey="count" fill="#e11900" radius={[5, 5, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-nfc-border p-6">
              <h2 className="font-bold text-nfc-dark mb-5 text-sm flex items-center gap-2">
                <span className="w-2 h-4 rounded-full bg-nfc-dark inline-block"></span>
                Line Chart — Tap Trend
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data!.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e4df" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "Space Mono, monospace", fill: "#8a857c" }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "Space Mono, monospace", fill: "#8a857c" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7e4df", fontFamily: "Archivo", fontSize: 12 }} formatter={(v) => [`${v}`, "Taps"]} />
                  <Line type="monotone" dataKey="count" stroke="#16140f" strokeWidth={2.5} dot={{ fill: "#e11900", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#e11900" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Tags */}
          {data!.topTags.length > 0 && (
            <div className="bg-white rounded-2xl border border-nfc-border p-6 mb-6">
              <h2 className="font-bold text-nfc-dark mb-4 text-sm">Top Tags by Total Taps</h2>
              <div className="space-y-3">
                {data!.topTags.map((tag, i) => {
                  const name = tag.user.profile ? `${tag.user.profile.firstName} ${tag.user.profile.lastName}` : tag.user.email;
                  const maxTaps = data!.topTags[0]._count.taps || 1;
                  const pct = Math.round((tag._count.taps / maxTaps) * 100);
                  return (
                    <div key={tag.tagSlug} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-nfc-muted w-5" style={{ fontFamily: "Space Mono, monospace" }}>#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-nfc-dark truncate">{name}</span>
                          <span className="font-bold text-nfc-red ml-4">{tag._count.taps} taps</span>
                        </div>
                        <div className="h-2 bg-nfc-outer rounded-full overflow-hidden">
                          <div className="h-full bg-nfc-red rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <a href={`/tag/${tag.tagSlug}`} target="_blank" className="text-xs text-nfc-muted hover:text-nfc-dark underline ml-2">View</a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tap log table */}
          <div className="bg-white rounded-2xl border border-nfc-border overflow-hidden">
            <div className="px-6 py-4 border-b border-nfc-border flex items-center justify-between">
              <h2 className="font-bold text-nfc-dark text-sm">Recent Tap Log</h2>
              <span className="text-xs text-nfc-muted">{totalInRange} events</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-nfc-border/50">
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Time</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Cyclist</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Tag ID</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.taps.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-10 text-nfc-muted text-sm">No taps in this period</td></tr>
                  ) : (
                    data!.taps.map((tap) => {
                      const name = tap.tag.user.profile
                        ? `${tap.tag.user.profile.firstName} ${tap.tag.user.profile.lastName}`
                        : tap.tag.user.email;
                      return (
                        <tr key={tap.id} className="border-b border-nfc-border/30 hover:bg-nfc-bg/50">
                          <td className="px-4 py-2.5 text-xs text-nfc-muted" style={{ fontFamily: "Space Mono, monospace" }}>
                            {new Date(tap.tappedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-medium text-nfc-dark">{name}</td>
                          <td className="px-4 py-2.5">
                            <code className="text-xs text-nfc-muted bg-nfc-outer px-2 py-0.5 rounded-md">{tap.tag.tagSlug.slice(0, 12)}…</code>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-nfc-muted" style={{ fontFamily: "Space Mono, monospace" }}>{tap.ipAddress || "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {data!.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-nfc-border">
                <p className="text-xs text-nfc-muted">Page {page} of {data!.pages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-nfc-outer text-nfc-dark disabled:opacity-40">← Prev</button>
                  <button onClick={() => setPage((p) => Math.min(data!.pages, p + 1))} disabled={page === data!.pages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-nfc-outer text-nfc-dark disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
