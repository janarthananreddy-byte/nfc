"use client";
import { useEffect, useState } from "react";

interface Log {
  id: string; actorEmail: string; action: string;
  targetType: string; targetId: string; targetLabel: string; details: string; createdAt: string;
}

const ACTION_LABEL: Record<string, string> = {
  tag_url_changed: "Tag URL changed",
  tag_enabled: "Tag enabled",
  tag_disabled: "Tag disabled",
  user_deleted: "User deleted",
  order_status_changed: "Order status changed",
  profile_updated: "Profile updated",
  profile_created: "Profile created",
  contact_added: "Contact added",
  contact_updated: "Contact updated",
  contact_deleted: "Contact deleted",
  address_updated: "Address updated",
};
const ACTION_STYLE: Record<string, string> = {
  tag_url_changed: "bg-blue-50 text-blue-700 border-blue-200",
  tag_enabled: "bg-green-50 text-green-700 border-green-200",
  tag_disabled: "bg-amber-50 text-amber-700 border-amber-200",
  user_deleted: "bg-red-50 text-red-700 border-red-200",
  order_status_changed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  profile_updated: "bg-purple-50 text-purple-700 border-purple-200",
  profile_created: "bg-purple-50 text-purple-700 border-purple-200",
  contact_added: "bg-teal-50 text-teal-700 border-teal-200",
  contact_updated: "bg-teal-50 text-teal-700 border-teal-200",
  contact_deleted: "bg-red-50 text-red-700 border-red-200",
  address_updated: "bg-sky-50 text-sky-700 border-sky-200",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  function load(p: number) {
    setLogs(null);
    fetch(`/api/admin/audit?page=${p}`).then((r) => r.json()).then((d) => {
      setLogs(Array.isArray(d.logs) ? d.logs : []);
      setPages(d.pages || 1); setTotal(d.total || 0);
    }).catch(() => setLogs([]));
  }
  useEffect(() => { load(page); }, [page]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Audit Log</h1>
          <p className="text-nfc-muted text-sm mt-1">{total} recorded changes · who changed what and when</p>
        </div>
        <button onClick={() => load(page)} title="Refresh" className="px-4 py-2 bg-white border border-nfc-border rounded-xl text-sm font-bold text-nfc-dark hover:bg-nfc-outer transition-colors">↻ Refresh</button>
      </div>

      <div className="bg-white rounded-2xl border border-nfc-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-nfc-outer border-b-2 border-nfc-border">
                <th className="text-left px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Changed on</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Action</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Target</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs === null ? (
                <tr><td colSpan={5} className="text-center py-12 text-nfc-muted text-sm">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-nfc-muted text-sm">No changes recorded yet.</td></tr>
              ) : (
                logs.map((l, i) => (
                  <tr key={l.id} className={`border-b border-nfc-border/50 ${i % 2 ? "bg-nfc-outer/40" : "bg-white"}`}>
                    <td className="px-4 py-3 text-xs text-nfc-muted whitespace-nowrap">{new Date(l.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3 text-sm text-nfc-dark">{l.actorEmail || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ACTION_STYLE[l.action] || "bg-nfc-outer text-nfc-muted border-nfc-border"}`}>{ACTION_LABEL[l.action] || l.action}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-nfc-dark">{l.targetLabel || l.targetId || "—"}</td>
                    <td className="px-4 py-3 text-sm text-nfc-muted">{l.details || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-nfc-border">
            <p className="text-xs text-nfc-muted">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-nfc-outer text-nfc-dark disabled:opacity-40 hover:bg-nfc-border transition-colors">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-nfc-outer text-nfc-dark disabled:opacity-40 hover:bg-nfc-border transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
