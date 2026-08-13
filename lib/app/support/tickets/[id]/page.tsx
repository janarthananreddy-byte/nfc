"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge, PriorityBadge, fmtDate, agentName } from "@/components/support/badges";
import { readFiles, humanSize, UploadFile } from "@/components/support/upload";

interface Att { id: string; filename: string; sizeBytes: number }
interface Comment { id: string; body: string; visibility: string; kind: string; createdAt: string; author: { id: string; email: string; role: string; profile?: { firstName?: string; lastName?: string } | null }; attachments: Att[] }
interface Ticket {
  id: string; ticketNo: string; subject: string; description: string; priority: string; status: string; createdAt: string; updatedAt: string; csatRating: number | null;
  category?: { name: string } | null; subCategory?: { name: string } | null; assignedAgent?: { email: string; profile?: { firstName?: string; lastName?: string } | null } | null;
  requester?: { email: string; profile?: { firstName?: string; lastName?: string } | null } | null; attachments: Att[]; comments: Comment[];
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [t, setT] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(0);
  const [csatComment, setCsatComment] = useState("");

  const load = useCallback(() => { fetch(`/api/tickets/${id}`).then((r) => r.json()).then((d) => setT(d.ticket || null)); }, [id]);
  useEffect(() => { load(); }, [load]);

  async function sendReply() {
    if (!reply.trim() && !files.length) return;
    setBusy(true);
    await fetch(`/api/tickets/${id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: reply, attachments: files }) });
    setReply(""); setFiles([]); setBusy(false); load();
  }
  async function act(path: string) { setBusy(true); await fetch(`/api/tickets/${id}/${path}`, { method: "POST" }); setBusy(false); load(); }
  async function submitCsat() { if (!rating) return; setBusy(true); await fetch(`/api/tickets/${id}/csat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, comment: csatComment }) }); setBusy(false); load(); }

  if (!t) return <div className="text-nfc-muted">Loading…</div>;
  const closed = ["RESOLVED", "CLOSED"].includes(t.status);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Link href="/support/tickets" className="text-sm text-nfc-muted hover:text-nfc-dark">← Back to My Tickets</Link>
        <div className="bg-white rounded-2xl border border-nfc-border p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-bold text-nfc-red" style={{ fontFamily: "Space Mono, monospace" }}>{t.ticketNo}</p>
              <h1 className="text-xl font-extrabold text-nfc-dark mt-1">{t.subject}</h1>
            </div>
            <div className="flex gap-2"><PriorityBadge priority={t.priority} /><StatusBadge status={t.status} /></div>
          </div>
          <p className="text-sm text-nfc-muted mt-4 whitespace-pre-wrap">{t.description}</p>
          {t.attachments.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{t.attachments.map((a) => <a key={a.id} href={`/api/attachments/${a.id}`} className="text-xs bg-nfc-bg border border-nfc-border rounded-lg px-3 py-1.5 hover:border-nfc-red/40">📎 {a.filename} <span className="text-nfc-subtle">({humanSize(a.sizeBytes)})</span></a>)}</div>}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-nfc-border p-6">
          <h2 className="font-bold text-nfc-dark mb-4">Conversation</h2>
          <div className="space-y-4">
            {t.comments.map((c) => {
              if (c.kind === "SYSTEM") return <div key={c.id} className="text-center text-xs text-nfc-subtle">{c.body} · {fmtDate(c.createdAt)}</div>;
              const staff = c.author.role === "agent" || c.author.role === "admin";
              return (
                <div key={c.id} className={`flex ${staff ? "" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${c.visibility === "INTERNAL" ? "bg-amber-50 border border-amber-200" : staff ? "bg-nfc-bg border border-nfc-border" : "bg-nfc-red text-white"}`}>
                    <div className={`text-xs font-bold mb-1 ${staff || c.visibility === "INTERNAL" ? "text-nfc-muted" : "text-white/80"}`}>{agentName(c.author)}{c.visibility === "INTERNAL" && " · Internal note"} · {fmtDate(c.createdAt)}</div>
                    {c.body && <p className={`text-sm whitespace-pre-wrap ${staff || c.visibility === "INTERNAL" ? "text-nfc-dark" : "text-white"}`}>{c.body}</p>}
                    {c.attachments.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{c.attachments.map((a) => <a key={a.id} href={`/api/attachments/${a.id}`} className={`text-xs rounded-lg px-2 py-1 ${staff || c.visibility === "INTERNAL" ? "bg-white border border-nfc-border" : "bg-white/20 text-white"}`}>📎 {a.filename}</a>)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {t.status !== "CLOSED" && (
            <div className="mt-5 border-t border-nfc-border pt-4">
              <textarea className="w-full px-4 py-3 rounded-xl border border-nfc-border bg-nfc-bg text-sm focus:outline-none focus:border-nfc-red" rows={3} placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
              <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                <input type="file" multiple onChange={async (e) => { if (e.target.files) { const nf = await readFiles(e.target.files); setFiles((p) => [...p, ...nf]); } }} className="text-xs text-nfc-muted" />
                <button onClick={sendReply} disabled={busy} className="px-5 py-2 bg-nfc-red text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-60">Send Reply</button>
              </div>
              {files.length > 0 && <p className="text-xs text-nfc-muted mt-1">{files.length} file(s) attached</p>}
            </div>
          )}
        </div>

        {/* CSAT */}
        {closed && t.csatRating == null && (
          <div className="bg-white rounded-2xl border border-nfc-border p-6">
            <h2 className="font-bold text-nfc-dark mb-2">How was our support?</h2>
            <div className="flex gap-1 mb-3">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} className={`text-3xl ${n <= rating ? "text-amber-400" : "text-nfc-border"}`}>★</button>)}</div>
            <textarea className="w-full px-4 py-2 rounded-xl border border-nfc-border bg-nfc-bg text-sm mb-3" rows={2} placeholder="Optional feedback…" value={csatComment} onChange={(e) => setCsatComment(e.target.value)} />
            <button onClick={submitCsat} disabled={!rating || busy} className="px-5 py-2 bg-nfc-red text-white rounded-xl text-sm font-bold disabled:opacity-60">Submit Rating</button>
          </div>
        )}
        {t.csatRating != null && <div className="bg-white rounded-2xl border border-nfc-border p-6 text-sm text-nfc-muted">You rated this support <span className="text-amber-400 font-bold">{"★".repeat(t.csatRating)}</span> ({t.csatRating}/5). Thank you!</div>}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-nfc-border p-5 space-y-3 text-sm">
          <Info label="Status"><StatusBadge status={t.status} /></Info>
          <Info label="Priority"><PriorityBadge priority={t.priority} /></Info>
          <Info label="Category"><span className="text-nfc-dark">{t.category?.name || "—"}{t.subCategory ? ` › ${t.subCategory.name}` : ""}</span></Info>
          <Info label="Assigned Agent"><span className="text-nfc-dark">{agentName(t.assignedAgent)}</span></Info>
          <Info label="Created"><span className="text-nfc-dark">{fmtDate(t.createdAt)}</span></Info>
          <Info label="Last Updated"><span className="text-nfc-dark">{fmtDate(t.updatedAt)}</span></Info>
        </div>
        <div className="bg-white rounded-2xl border border-nfc-border p-5 space-y-2">
          {t.status === "RESOLVED" && <button onClick={() => act("close")} disabled={busy} className="w-full px-4 py-2.5 bg-nfc-dark text-white rounded-xl text-sm font-bold">Close Ticket</button>}
          {closed && <button onClick={() => act("reopen")} disabled={busy} className="w-full px-4 py-2.5 bg-white border border-nfc-border text-nfc-dark rounded-xl text-sm font-bold hover:border-nfc-red/40">Request Reopen</button>}
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>{label}</span>{children}</div>;
}
