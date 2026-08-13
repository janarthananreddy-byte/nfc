"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge, fmtDate } from "@/components/support/badges";

interface Row { id: string; ticketNo: string; subject: string; priority: string; status: string; updatedAt: string }

export default function SupportDashboard() {
  const [recent, setRecent] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/tickets?page=1").then((r) => r.json()).then((d) => setRecent(d.tickets || []));
    Promise.all(["OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED"].map((s) =>
      fetch("/api/tickets?status=" + s).then((r) => r.json()).then((d) => [s, d.total || 0] as [string, number])
    )).then((pairs) => setCounts(Object.fromEntries(pairs)));
  }, []);

  const kpis = [
    { label: "Open", value: counts.OPEN, color: "#4338ca" },
    { label: "In Progress", value: counts.IN_PROGRESS, color: "#b45309" },
    { label: "Pending You", value: counts.PENDING_CUSTOMER, color: "#7e22ce" },
    { label: "Resolved", value: counts.RESOLVED, color: "#047857" },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><h1 className="text-2xl font-extrabold text-nfc-dark">Support Dashboard</h1><p className="text-nfc-muted text-sm">Track and manage your support requests.</p></div>
        <Link href="/support/new" className="px-4 py-2 bg-nfc-red text-white rounded-xl text-sm font-bold hover:bg-red-700">+ New Ticket</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-nfc-border p-5">
            <p className="text-3xl font-extrabold" style={{ color: k.color }}>{k.value ?? "—"}</p>
            <p className="text-xs font-bold text-nfc-muted uppercase tracking-widest mt-1" style={{ fontFamily: "Space Mono, monospace" }}>{k.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-nfc-border overflow-hidden">
        <div className="px-5 py-4 border-b border-nfc-border flex items-center justify-between"><h2 className="font-bold text-nfc-dark">Recent Tickets</h2><Link href="/support/tickets" className="text-sm text-nfc-red font-bold hover:underline">View all →</Link></div>
        {recent.length === 0 ? <p className="px-5 py-10 text-center text-nfc-muted text-sm">No tickets yet. Create your first one!</p> :
          <ul className="divide-y divide-nfc-border/60">{recent.map((t) => (
            <li key={t.id}><Link href={`/support/tickets/${t.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-nfc-bg/50 gap-3">
              <div className="min-w-0"><p className="font-bold text-nfc-red text-sm" style={{ fontFamily: "Space Mono, monospace" }}>{t.ticketNo}</p><p className="text-sm text-nfc-dark truncate">{t.subject}</p></div>
              <div className="flex items-center gap-2 shrink-0"><PriorityBadge priority={t.priority} /><StatusBadge status={t.status} /><span className="text-xs text-nfc-subtle hidden sm:block">{fmtDate(t.updatedAt)}</span></div>
            </Link></li>
          ))}</ul>}
      </div>
    </div>
  );
}
