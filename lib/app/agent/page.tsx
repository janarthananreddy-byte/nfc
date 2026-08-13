"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { STATUS_META, PRIORITY_META } from "@/components/support/badges";

interface Stats {
  kpis: Record<string, number>;
  byStatus: Record<string, number>; byPriority: Record<string, number>;
  byCategory: { name: string; count: number }[]; createdOverTime: { date: string; count: number }[]; workload: { name: string; count: number }[];
}
const CATCOLORS = ["#012963", "#e11900", "#f59e0b", "#10b981", "#6366f1", "#a855f7", "#0ea5e9", "#64748b"];

export default function AgentDashboard() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { fetch("/api/admin/support-stats").then((r) => r.json()).then(setS); }, []);
  if (!s) return <div className="text-nfc-muted">Loading…</div>;
  const k = s.kpis;
  const kpiCards = [
    { label: "Total", value: k.total, c: "#012963" }, { label: "New", value: k.new, c: "#3b82f6" }, { label: "Open", value: k.open, c: "#6366f1" },
    { label: "In Progress", value: k.inProgress, c: "#f59e0b" }, { label: "Pending", value: k.pending, c: "#a855f7" }, { label: "Resolved", value: k.resolved, c: "#10b981" },
    { label: "Closed", value: k.closed, c: "#64748b" }, { label: "Critical", value: k.critical, c: "#e11900" }, { label: "SLA Overdue", value: k.overdue, c: "#dc2626" },
  ];
  const statusData = Object.entries(s.byStatus).map(([key, count]) => ({ name: STATUS_META[key]?.label || key, count, color: STATUS_META[key]?.color || "#64748b" }));
  const priorityData = Object.entries(s.byPriority).map(([key, count]) => ({ name: PRIORITY_META[key]?.label || key, count, color: PRIORITY_META[key]?.color || "#64748b" }));

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-nfc-dark mb-6">Support Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {kpiCards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-nfc-border p-4">
            <p className="text-2xl font-extrabold" style={{ color: c.c }}>{c.value ?? 0}</p>
            <p className="text-[10px] font-bold text-nfc-muted uppercase tracking-widest mt-1" style={{ fontFamily: "Space Mono, monospace" }}>{c.label}</p>
          </div>
        ))}
        <div className="bg-white rounded-2xl border border-nfc-border p-4"><p className="text-2xl font-extrabold text-amber-500">{k.csatAvg || 0}<span className="text-sm">/5</span></p><p className="text-[10px] font-bold text-nfc-muted uppercase tracking-widest mt-1" style={{ fontFamily: "Space Mono, monospace" }}>CSAT ({k.csatCount})</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Tickets Created (14 days)">
          <ResponsiveContainer width="100%" height={220}><LineChart data={s.createdOverTime}><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#e11900" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
        </Card>
        <Card title={`Avg Resolution: ${k.avgResolutionHrs || 0}h`}>
          <ResponsiveContainer width="100%" height={220}><BarChart data={s.workload}><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Open tickets" fill="#012963" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </Card>
        <Card title="By Status">
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{statusData.map((d, i) => <Cell key={i} fill={d.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        </Card>
        <Card title="By Priority">
          <ResponsiveContainer width="100%" height={220}><BarChart data={priorityData}><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip /><Bar dataKey="count" radius={[6, 6, 0, 0]}>{priorityData.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar></BarChart></ResponsiveContainer>
        </Card>
        <Card title="By Category">
          <ResponsiveContainer width="100%" height={220}><BarChart data={s.byCategory} layout="vertical"><XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} /><Tooltip /><Bar dataKey="count" radius={[0, 6, 6, 0]}>{s.byCategory.map((d, i) => <Cell key={i} fill={CATCOLORS[i % CATCOLORS.length]} />)}</Bar></BarChart></ResponsiveContainer>
        </Card>
        <Card title="Escalated / Reopened">
          <div className="flex gap-4 h-[220px] items-center justify-center">
            <div className="text-center"><p className="text-4xl font-extrabold text-nfc-red">{k.escalated || 0}</p><p className="text-xs text-nfc-muted uppercase tracking-widest mt-1">Escalated</p></div>
            <div className="text-center"><p className="text-4xl font-extrabold text-amber-500">{k.reopened || 0}</p><p className="text-xs text-nfc-muted uppercase tracking-widest mt-1">Reopened</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-nfc-border p-5"><h3 className="font-bold text-nfc-dark mb-3 text-sm">{title}</h3>{children}</div>;
}
