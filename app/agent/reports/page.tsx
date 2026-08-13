"use client";
import { useEffect, useState, useCallback } from "react";

interface Summary { volume: number; open: number; closed: number; byCategory: Record<string, number>; byPriority: Record<string, number>; byStatus: Record<string, number>; byAgent: Record<string, number>; avgFirstResponseHrs: number; avgResolutionHrs: number; slaCompliance: number; csatAvg: number; csatCount: number; reopened: number; escalated: number }
interface Row { ticketNo: string; subject: string; category: string; priority: string; status: string; customer: string; agent: string; createdAt: string; resolvedAt: string | null; csatRating: number | string; reopenCount: number; escalated: string }
interface Meta { agents: { id: string; email: string; profile?: { firstName?: string; lastName?: string } | null }[]; categories: { id: string; name: string; parentId: string | null }[] }

export default function ReportsPage() {
  const [sum, setSum] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [f, setF] = useState({ from: "", to: "", category: "", priority: "", agent: "", status: "" });

  useEffect(() => { fetch("/api/admin/agents").then((r) => r.json()).then(setMeta); }, []);
  const load = useCallback(() => {
    const p = new URLSearchParams(f);
    fetch("/api/admin/support-reports?" + p.toString()).then((r) => r.json()).then((d) => { setSum(d.summary); setRows(d.rows || []); });
  }, [f]);
  useEffect(() => { load(); }, [load]);
  const up = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  function toCSV() {
    const head = ["Ticket", "Subject", "Category", "Priority", "Status", "Customer", "Agent", "Created", "Resolved", "CSAT", "Reopens", "Escalated"];
    const lines = [head.join(",")].concat(rows.map((r) => [r.ticketNo, r.subject, r.category, r.priority, r.status, r.customer, r.agent, r.createdAt, r.resolvedAt || "", r.csatRating, r.reopenCount, r.escalated].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")));
    return lines.join("\n");
  }
  function download(content: string, type: string, name: string) {
    const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  }
  const exportCSV = () => download(toCSV(), "text/csv", "tickets-report.csv");
  const exportXLS = () => {
    const rowsHtml = [`<tr>${["Ticket", "Subject", "Category", "Priority", "Status", "Customer", "Agent", "Created", "Resolved", "CSAT", "Reopens", "Escalated"].map((h) => `<th>${h}</th>`).join("")}</tr>`]
      .concat(rows.map((r) => `<tr>${[r.ticketNo, r.subject, r.category, r.priority, r.status, r.customer, r.agent, r.createdAt, r.resolvedAt || "", r.csatRating, r.reopenCount, r.escalated].map((v) => `<td>${String(v)}</td>`).join("")}</tr>`)).join("");
    download(`<html><head><meta charset="utf-8"></head><body><table border="1">${rowsHtml}</table></body></html>`, "application/vnd.ms-excel", "tickets-report.xls");
  };

  const sel = "px-3 py-2 rounded-lg border border-nfc-border bg-white text-sm";
  const Metric = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-white rounded-2xl border border-nfc-border p-4"><p className="text-2xl font-extrabold text-nfc-dark">{value}</p><p className="text-[10px] font-bold text-nfc-muted uppercase tracking-widest mt-1" style={{ fontFamily: "Space Mono, monospace" }}>{label}</p></div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold text-nfc-dark">Reports</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-2 bg-white border border-nfc-border rounded-lg text-sm font-bold">Export CSV</button>
          <button onClick={exportXLS} className="px-3 py-2 bg-white border border-nfc-border rounded-lg text-sm font-bold">Export Excel</button>
          <button onClick={() => window.print()} className="px-3 py-2 bg-nfc-red text-white rounded-lg text-sm font-bold">Print / PDF</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="date" className={sel} value={f.from} onChange={(e) => up("from", e.target.value)} />
        <input type="date" className={sel} value={f.to} onChange={(e) => up("to", e.target.value)} />
        <select className={sel} value={f.category} onChange={(e) => up("category", e.target.value)}><option value="">Category</option>{(meta?.categories || []).filter((c) => c.parentId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className={sel} value={f.priority} onChange={(e) => up("priority", e.target.value)}><option value="">Priority</option>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select className={sel} value={f.status} onChange={(e) => up("status", e.target.value)}><option value="">Status</option>{["NEW", "OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
        <select className={sel} value={f.agent} onChange={(e) => up("agent", e.target.value)}><option value="">Agent</option>{(meta?.agents || []).map((a) => <option key={a.id} value={a.id}>{`${a.profile?.firstName || ""} ${a.profile?.lastName || ""}`.trim() || a.email}</option>)}</select>
      </div>
      {sum && <>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <Metric label="Volume" value={sum.volume} /><Metric label="Open" value={sum.open} /><Metric label="Closed" value={sum.closed} />
          <Metric label="Avg 1st Response" value={sum.avgFirstResponseHrs + "h"} /><Metric label="Avg Resolution" value={sum.avgResolutionHrs + "h"} /><Metric label="SLA Compliance" value={sum.slaCompliance + "%"} />
          <Metric label="CSAT" value={sum.csatAvg + "/5"} /><Metric label="CSAT Responses" value={sum.csatCount} /><Metric label="Reopened" value={sum.reopened} /><Metric label="Escalated" value={sum.escalated} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Breakdown title="By Category" data={sum.byCategory} /><Breakdown title="By Priority" data={sum.byPriority} />
          <Breakdown title="By Status" data={sum.byStatus} /><Breakdown title="By Agent" data={sum.byAgent} />
        </div>
      </>}
      <div className="bg-white rounded-2xl border border-nfc-border overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-nfc-muted border-b border-nfc-border text-xs uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>{["Ticket", "Subject", "Category", "Priority", "Status", "Customer", "Agent", "CSAT"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>{rows.slice(0, 100).map((r) => (
            <tr key={r.ticketNo} className="border-b border-nfc-border/60"><td className="px-3 py-2 font-bold text-nfc-red" style={{ fontFamily: "Space Mono, monospace" }}>{r.ticketNo}</td><td className="px-3 py-2 max-w-xs truncate">{r.subject}</td><td className="px-3 py-2">{r.category}</td><td className="px-3 py-2">{r.priority}</td><td className="px-3 py-2">{r.status}</td><td className="px-3 py-2">{r.customer}</td><td className="px-3 py-2">{r.agent}</td><td className="px-3 py-2">{r.csatRating || "—"}</td></tr>
          ))}</tbody>
        </table></div>
      </div>
    </div>
  );
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  return (
    <div className="bg-white rounded-2xl border border-nfc-border p-5">
      <h3 className="font-bold text-nfc-dark mb-3 text-sm">{title}</h3>
      <div className="space-y-2">{entries.map(([k, v]) => (
        <div key={k}><div className="flex justify-between text-xs mb-0.5"><span className="text-nfc-muted">{k.replace(/_/g, " ")}</span><span className="font-bold text-nfc-dark">{v}</span></div><div className="h-1.5 bg-nfc-bg rounded-full overflow-hidden"><div className="h-full bg-nfc-red rounded-full" style={{ width: `${(v / max) * 100}%` }} /></div></div>
      ))}</div>
    </div>
  );
}
