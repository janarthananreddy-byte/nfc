"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  totalUsers: number;
  totalTags: number;
  tapsToday: number;
  tapsWeek: number;
  tapsMonth: number;
  totalTaps: number;
  dailyTaps: { date: string; count: number }[];
}

interface DbTable { name: string; rows: number; bytes: number | null; }
interface DbStats { tables: DbTable[]; totalBytes: number | null; }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then((d) => { setStats(d); setLoading(false); });
    fetch("/api/admin/db-stats").then((r) => r.json()).then((d) => setDbStats(d)).catch(() => {});
  }, []);

  const now = new Date();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Admin Dashboard</h1>
        <p className="text-nfc-muted text-sm mt-1">
          {now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {loading ? (
        <div className="text-nfc-muted text-sm">Loading stats…</div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard label="USERS" value={String(stats!.totalUsers)} sub="Registered accounts" icon="user" />
            <StatCard label="ACTIVE TAGS" value={String(stats!.totalTags)} sub="NFC tags deployed" icon="tag" />
            <StatCard label="TAPS TODAY" value={String(stats!.tapsToday)} sub="Scans in last 24h" icon="scan" red />
            <StatCard label="TOTAL TAPS" value={String(stats!.totalTaps)} sub="All time scans" icon="chart" />
          </div>

          {/* Secondary stats row */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-nfc-border p-5">
              <p className="text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1" style={{ fontFamily: "Space Mono, monospace" }}>THIS WEEK</p>
              <p className="text-3xl font-extrabold text-nfc-dark">{stats!.tapsWeek}</p>
              <p className="text-xs text-nfc-subtle mt-1">Taps in last 7 days</p>
            </div>
            <div className="bg-white rounded-2xl border border-nfc-border p-5">
              <p className="text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1" style={{ fontFamily: "Space Mono, monospace" }}>THIS MONTH</p>
              <p className="text-3xl font-extrabold text-nfc-dark">{stats!.tapsMonth}</p>
              <p className="text-xs text-nfc-subtle mt-1">Taps since month start</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl border border-nfc-border p-6">
            <h2 className="font-bold text-nfc-dark mb-6 flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-nfc-red inline-block"></span>
              NFC Taps — Last 7 Days
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats!.dailyTaps} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e4df" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "Space Mono, monospace", fill: "#8a857c" }} />
                <YAxis tick={{ fontSize: 11, fontFamily: "Space Mono, monospace", fill: "#8a857c" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e7e4df", fontFamily: "Inter, sans-serif", fontSize: 13 }}
                  formatter={(v) => [`${v} taps`, "Scans"]}
                />
                <Bar dataKey="count" fill="#e11900" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {dbStats && (
            <div className="bg-white rounded-2xl border border-nfc-border overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-nfc-border flex items-center justify-between">
                <h2 className="font-bold text-nfc-dark text-sm">Database Tables</h2>
                <span className="text-xs text-nfc-muted">{dbStats.totalBytes != null ? "Total " + fmtBytes(dbStats.totalBytes) : dbStats.tables.length + " tables"}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-nfc-outer border-b-2 border-nfc-border">
                      <th className="text-left px-6 py-2.5 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Table</th>
                      <th className="text-right px-6 py-2.5 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Rows</th>
                      <th className="text-right px-6 py-2.5 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbStats.tables.map((t, i) => (
                      <tr key={t.name} className={"border-b border-nfc-border/50 " + (i % 2 ? "bg-nfc-outer/40" : "bg-white")}>
                        <td className="px-6 py-2.5 text-sm font-medium text-nfc-dark" style={{ fontFamily: "Space Mono, monospace" }}>{t.name}</td>
                        <td className="px-6 py-2.5 text-sm text-nfc-dark text-right">{t.rows.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-2.5 text-sm text-nfc-muted text-right">{t.bytes != null ? fmtBytes(t.bytes) : "n/a"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function fmtBytes(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(2) + " MB";
}

function StatCard({ label, value, sub, icon, red }: { label: string; value: string; sub: string; icon: string; red?: boolean }) {
  const icons: Record<string, React.ReactNode> = {
    user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    tag: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    scan: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  };

  return (
    <div className={`rounded-2xl border p-5 ${red ? "bg-nfc-red border-nfc-red text-white" : "bg-white border-nfc-border"}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${red ? "bg-white/20 text-white" : "bg-nfc-red-light text-nfc-red"}`}>
        {icons[icon]}
      </div>
      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${red ? "text-white/70" : "text-nfc-muted"}`} style={{ fontFamily: "Space Mono, monospace" }}>{label}</p>
      <p className={`text-3xl font-extrabold ${red ? "text-white" : "text-nfc-dark"}`}>{value}</p>
      <p className={`text-xs mt-1 ${red ? "text-white/60" : "text-nfc-subtle"}`}>{sub}</p>
    </div>
  );
}
