"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge, fmtDate, agentName } from "@/components/support/badges";

interface Row { id: string; ticketNo: string; subject: string; priority: string; status: string; createdAt: string; updatedAt: string; category?: { name: string } | null; assignedAgent?: { email: string; profile?: { firstName?: string; lastName?: string } | null } | null; requester?: { email: string; profile?: { firstName?: string; lastName?: string } | null } | null }
interface Meta { agents: { id: string; email: string; profile?: { firstName?: string; lastName?: string } | null }[]; teams: { id: string; name: string }[]; categories: { id: string; name: string; parentId: string | null }[] }

export default function AgentTicketsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [f, setF] = useState({ q: "", status: "", priority: "", category: "", agent: "", team: "" });
  const [sort, setSort] = useState({ sort: "updatedAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/admin/agents").then((r) => r.json()).then(setMeta); }, []);
  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ ...f, ...sort, page: String(page) });
    fetch("/api/admin/tickets?" + p.toString()).then((r) => r.json()).then((d) => { setRows(d.tickets || []); setPages(d.pages || 1); setLoading(false); });
  }, [f, sort, page]);
  useEffect(() => { load(); }, [load]);
  const up = (k: string, v: string) => { setPage(1); setF((s) => ({ ...s, [k]: v })); };
  const toggleSort = (col: string) => setSort((s) => ({ sort: col, dir: s.sort === col && s.dir === "desc" ? "asc" : "desc" }));
  const sel = "px-3 py-2 rounded-lg border border-nfc-border bg-white text-sm";

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-nfc-dark mb-4">All Tickets</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <input className={sel + " flex-1 min-w-48"} placeholder="Search number, subject, description, customer…" value={f.q} onChange={(e) => up("q", e.target.value)} />
        <select className={sel} value={f.status} onChange={(e) => up("status", e.target.value)}><option value="">Status</option>{["NEW", "OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
        <select className={sel} value={f.priority} onChange={(e) => up("priority", e.target.value)}><option value="">Priority</option>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select className={sel} value={f.category} onChange={(e) => up("category", e.target.value)}><option value="">Category</option>{(meta?.categories || []).filter((c) => c.parentId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className={sel} value={f.agent} onChange={(e) => up("agent", e.target.value)}><option value="">Agent</option>{(meta?.agents || []).map((a) => <option key={a.id} value={a.id}>{agentName(a)}</option>)}</select>
      </div>
      <div className="bg-white rounded-2xl border border-nfc-border overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-nfc-muted border-b border-nfc-border" style={{ fontFamily: "Space Mono, monospace" }}>
            {[["ticketNo", "Ticket"], ["subject", "Subject"], ["", "Customer"], ["priority", "Priority"], ["status", "Status"], ["updatedAt", "Updated"], ["", "Agent"]].map(([col, lbl]) => (
              <th key={lbl} className={`px-4 py-3 text-xs uppercase tracking-widest ${col ? "cursor-pointer select-none" : ""}`} onClick={() => col && toggleSort(col)}>{lbl}{sort.sort === col && (sort.dir === "desc" ? " ↓" : " ↑")}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="px-4 py-10 text-center text-nfc-muted">Loading…</td></tr> :
              rows.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-nfc-muted">No tickets.</td></tr> :
              rows.map((t) => (
                <tr key={t.id} className="border-b border-nfc-border/60 hover:bg-nfc-bg/50">
                  <td className="px-4 py-3"><Link href={`/agent/tickets/${t.id}`} className="font-bold text-nfc-red hover:underline" style={{ fontFamily: "Space Mono, monospace" }}>{t.ticketNo}</Link></td>
                  <td className="px-4 py-3 max-w-xs truncate">{t.subject}</td>
                  <td className="px-4 py-3 text-nfc-muted">{agentName(t.requester)}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-nfc-muted whitespace-nowrap">{fmtDate(t.updatedAt)}</td>
                  <td className="px-4 py-3 text-nfc-muted">{agentName(t.assignedAgent)}</td>
                </tr>
              ))}
          </tbody>
        </table></div>
      </div>
      {pages > 1 && <div className="flex items-center justify-center gap-2 mt-4">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-nfc-border text-sm disabled:opacity-40">Prev</button>
        <span className="text-sm text-nfc-muted">Page {page} of {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-nfc-border text-sm disabled:opacity-40">Next</button>
      </div>}
    </div>
  );
}
