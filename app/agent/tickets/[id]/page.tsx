"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge, PriorityBadge, fmtDate, agentName } from "@/components/support/badges";
import { readFiles, humanSize, UploadFile } from "@/components/support/upload";

interface Att { id: string; filename: string; sizeBytes: number }
interface Comment { id: string; body: string; visibility: string; kind: string; createdAt: string; author: { id: string; email: string; role: string; profile?: { firstName?: string; lastName?: string } | null }; attachments: Att[] }
interface Ticket { id: string; ticketNo: string; subject: string; description: string; priority: string; status: string; createdAt: string; updatedAt: string; escalated: boolean; csatRating: number | null; categoryId?: string | null; subCategoryId?: string | null; assignedAgentId?: string | null; assignedTeamId?: string | null; category?: { name: string } | null; requester?: { email: string; profile?: { firstName?: string; lastName?: string } | null } | null; attachments: Att[]; comments: Comment[] }
interface Meta { agents: { id: string; email: string; profile?: { firstName?: string; lastName?: string } | null }[]; teams: { id: string; name: string }[]; categories: { id: string; name: string; parentId: string | null }[]; statuses: { key: string; label: string }[] }

export default function AgentTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [t, setT] = useState<Ticket | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [mergeNo, setMergeNo] = useState("");

  const load = useCallback(() => { fetch(`/api/tickets/${id}`).then((r) => r.json()).then((d) => setT(d.ticket || null)); }, [id]);
  useEffect(() => { load(); fetch("/api/admin/agents").then((r) => r.json()).then(setMeta); }, [load]);

  async function patch(body: Record<string, unknown>) { setBusy(true); await fetch(`/api/admin/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); setBusy(false); load(); }
  async function sendReply() { if (!reply.trim() && !files.length) return; setBusy(true); await fetch(`/api/tickets/${id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: reply, internal, attachments: files }) }); setReply(""); setFiles([]); setBusy(false); load(); }
  async function merge() { if (!mergeNo.trim()) return; setBusy(true); const r = await fetch(`/api/admin/tickets/${id}/merge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetTicketNo: mergeNo }) }); setBusy(false); if (r.ok) { setMergeNo(""); load(); } else alert((await r.json()).error); }

  if (!t) return <div className="text-nfc-muted">Loading…</div>;
  const subs = (meta?.categories || []).filter((c) => c.parentId === t.categoryId);
  const sel = "w-full px-3 py-2 rounded-lg border border-nfc-border bg-white text-sm";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Link href="/agent/tickets" className="text-sm text-nfc-muted hover:text-nfc-dark">← All Tickets</Link>
        <div className="bg-white rounded-2xl border border-nfc-border p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div><p className="text-xs font-bold text-nfc-red" style={{ fontFamily: "Space Mono, monospace" }}>{t.ticketNo}{t.escalated && <span className="ml-2 text-white bg-nfc-red rounded px-1.5 py-0.5">ESCALATED</span>}</p><h1 className="text-xl font-extrabold text-nfc-dark mt-1">{t.subject}</h1><p className="text-xs text-nfc-muted mt-1">From {agentName(t.requester)} · {t.requester?.email}</p></div>
            <div className="flex gap-2"><PriorityBadge priority={t.priority} /><StatusBadge status={t.status} /></div>
          </div>
          <p className="text-sm text-nfc-muted mt-4 whitespace-pre-wrap">{t.description}</p>
          {t.attachments.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{t.attachments.map((a) => <a key={a.id} href={`/api/attachments/${a.id}`} className="text-xs bg-nfc-bg border border-nfc-border rounded-lg px-3 py-1.5">📎 {a.filename} ({humanSize(a.sizeBytes)})</a>)}</div>}
        </div>

        <div className="bg-white rounded-2xl border border-nfc-border p-6">
          <h2 className="font-bold text-nfc-dark mb-4">Conversation</h2>
          <div className="space-y-4">
            {t.comments.map((c) => {
              if (c.kind === "SYSTEM") return <div key={c.id} className="text-center text-xs text-nfc-subtle">{c.body} · {fmtDate(c.createdAt)}</div>;
              const staff = c.author.role === "agent" || c.author.role === "admin";
              return (
                <div key={c.id} className={`flex ${staff ? "justify-end" : ""}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${c.visibility === "INTERNAL" ? "bg-amber-50 border border-amber-200" : staff ? "bg-nfc-red text-white" : "bg-nfc-bg border border-nfc-border"}`}>
                    <div className={`text-xs font-bold mb-1 ${c.visibility === "INTERNAL" ? "text-amber-700" : staff ? "text-white/80" : "text-nfc-muted"}`}>{agentName(c.author)}{c.visibility === "INTERNAL" && " · Internal note"} · {fmtDate(c.createdAt)}</div>
                    {c.body && <p className={`text-sm whitespace-pre-wrap ${c.visibility === "INTERNAL" ? "text-amber-900" : staff ? "text-white" : "text-nfc-dark"}`}>{c.body}</p>}
                    {c.attachments.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{c.attachments.map((a) => <a key={a.id} href={`/api/attachments/${a.id}`} className="text-xs bg-white/20 rounded px-2 py-1">📎 {a.filename}</a>)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 border-t border-nfc-border pt-4">
            <textarea className="w-full px-4 py-3 rounded-xl border border-nfc-border bg-nfc-bg text-sm focus:outline-none focus:border-nfc-red" rows={3} placeholder={internal ? "Internal note (not visible to customer)…" : "Reply to customer…"} value={reply} onChange={(e) => setReply(e.target.value)} />
            <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm text-nfc-muted"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note</label>
                <input type="file" multiple onChange={async (e) => { if (e.target.files) { const nf = await readFiles(e.target.files); setFiles((p) => [...p, ...nf]); } }} className="text-xs text-nfc-muted" />
              </div>
              <button onClick={sendReply} disabled={busy} className="px-5 py-2 bg-nfc-red text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-60">{internal ? "Add Note" : "Send Reply"}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Management sidebar */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-nfc-border p-5 space-y-3">
          <h3 className="font-bold text-nfc-dark text-sm">Manage</h3>
          <Field label="Status"><select className={sel} value={t.status} onChange={(e) => patch({ status: e.target.value })}>{(meta?.statuses || [{ key: t.status, label: t.status }]).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></Field>
          <Field label="Priority"><select className={sel} value={t.priority} onChange={(e) => patch({ priority: e.target.value })}>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p} value={p}>{p}</option>)}</select></Field>
          <Field label="Category"><select className={sel} value={t.categoryId || ""} onChange={(e) => patch({ categoryId: e.target.value, subCategoryId: "" })}><option value="">—</option>{(meta?.categories || []).filter((c) => !c.parentId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          {subs.length > 0 && <Field label="Sub-category"><select className={sel} value={t.subCategoryId || ""} onChange={(e) => patch({ subCategoryId: e.target.value })}><option value="">—</option>{subs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
          <Field label="Assign Agent"><select className={sel} value={t.assignedAgentId || ""} onChange={(e) => patch({ assignedAgentId: e.target.value })}><option value="">Unassigned</option>{(meta?.agents || []).map((a) => <option key={a.id} value={a.id}>{agentName(a)}</option>)}</select></Field>
          <Field label="Assign Team"><select className={sel} value={t.assignedTeamId || ""} onChange={(e) => patch({ assignedTeamId: e.target.value })}><option value="">—</option>{(meta?.teams || []).map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}</select></Field>
        </div>
        <div className="bg-white rounded-2xl border border-nfc-border p-5 space-y-2">
          <button onClick={() => patch({ escalated: !t.escalated })} disabled={busy} className="w-full px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold">{t.escalated ? "De-escalate" : "Escalate"}</button>
          <div className="flex gap-2"><input className={sel} placeholder="TKT-YYYY-000001" value={mergeNo} onChange={(e) => setMergeNo(e.target.value)} /><button onClick={merge} disabled={busy} className="px-3 py-2 bg-nfc-dark text-white rounded-lg text-sm font-bold whitespace-nowrap">Merge</button></div>
        </div>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1" style={{ fontFamily: "Space Mono, monospace" }}>{label}</p>{children}</div>;
}
