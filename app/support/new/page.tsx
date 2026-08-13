"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { readFiles, humanSize, UploadFile } from "@/components/support/upload";

interface Cat { id: string; name: string; type: string; parentId: string | null }

export default function NewTicketPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState({ subject: "", description: "", categoryId: "", subCategoryId: "", priority: "MEDIUM", contactInfo: "", referenceNo: "" });
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ id: string; ticketNo: string } | null>(null);

  useEffect(() => { fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.categories || [])); }, []);
  const parents = cats.filter((c) => !c.parentId);
  const subs = cats.filter((c) => c.parentId === form.categoryId);
  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function addFiles(fl: FileList | null) {
    if (!fl) return;
    try { const list = await readFiles(fl); setFiles((p) => [...p, ...list]); } catch { setError("Could not read file."); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.subject.trim() || !form.description.trim()) { setError("Subject and description are required."); return; }
    setSaving(true);
    const res = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, attachments: files }) });
    setSaving(false);
    if (res.ok) { const d = await res.json(); setCreated({ id: d.ticket.id, ticketNo: d.ticket.ticketNo }); }
    else { const d = await res.json(); setError(d.error || "Failed to create ticket."); }
  }

  if (created) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-nfc-border p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h1 className="text-xl font-extrabold text-nfc-dark mb-1">Ticket created</h1>
        <p className="text-nfc-muted text-sm mb-1">Your ticket number is</p>
        <p className="text-2xl font-extrabold text-nfc-red mb-6" style={{ fontFamily: "Space Mono, monospace" }}>{created.ticketNo}</p>
        <div className="flex gap-3 justify-center">
          <Link href={`/support/tickets/${created.id}`} className="px-5 py-2.5 bg-nfc-red text-white rounded-xl text-sm font-bold hover:bg-red-700">View Ticket</Link>
          <Link href="/support/tickets" className="px-5 py-2.5 bg-nfc-bg text-nfc-dark rounded-xl text-sm font-bold border border-nfc-border">My Tickets</Link>
        </div>
      </div>
    );
  }

  const label = "block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1.5";
  const field = "w-full px-4 py-3 rounded-xl border border-nfc-border bg-nfc-bg text-nfc-dark text-sm focus:outline-none focus:border-nfc-red focus:ring-2 focus:ring-nfc-red/10";
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-nfc-dark mb-1">Create a Ticket</h1>
      <p className="text-nfc-muted text-sm mb-6">Tell us what's going on and we'll help you out.</p>
      <form onSubmit={submit} className="bg-white rounded-2xl border border-nfc-border p-6 space-y-4">
        {error && <div className="bg-nfc-red-light border border-nfc-red/20 text-nfc-red rounded-xl px-4 py-3 text-sm">{error}</div>}
        <div><label className={label} style={{ fontFamily: "Space Mono, monospace" }}>Subject *</label><input className={field} value={form.subject} onChange={(e) => up("subject", e.target.value)} placeholder="Short summary of the issue" /></div>
        <div><label className={label} style={{ fontFamily: "Space Mono, monospace" }}>Description *</label><textarea className={field} rows={5} value={form.description} onChange={(e) => up("description", e.target.value)} placeholder="Describe the problem in detail" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label} style={{ fontFamily: "Space Mono, monospace" }}>Category</label>
            <select className={field} value={form.categoryId} onChange={(e) => { up("categoryId", e.target.value); up("subCategoryId", ""); }}>
              <option value="">Select…</option>{parents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className={label} style={{ fontFamily: "Space Mono, monospace" }}>Sub-category</label>
            <select className={field} value={form.subCategoryId} onChange={(e) => up("subCategoryId", e.target.value)} disabled={!subs.length}>
              <option value="">Select…</option>{subs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label} style={{ fontFamily: "Space Mono, monospace" }}>Priority</label>
            <select className={field} value={form.priority} onChange={(e) => up("priority", e.target.value)}>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
            </select></div>
          <div><label className={label} style={{ fontFamily: "Space Mono, monospace" }}>Reference / Order No.</label><input className={field} value={form.referenceNo} onChange={(e) => up("referenceNo", e.target.value)} placeholder="Optional" /></div>
        </div>
        <div><label className={label} style={{ fontFamily: "Space Mono, monospace" }}>Preferred Contact</label><input className={field} value={form.contactInfo} onChange={(e) => up("contactInfo", e.target.value)} placeholder="Email or phone we should reach you on" /></div>
        <div>
          <label className={label} style={{ fontFamily: "Space Mono, monospace" }}>Attachments</label>
          <input type="file" multiple onChange={(e) => addFiles(e.target.files)} className="text-sm text-nfc-muted" />
          {files.length > 0 && <ul className="mt-2 space-y-1">{files.map((f, i) => <li key={i} className="flex items-center justify-between text-sm bg-nfc-bg rounded-lg px-3 py-2"><span className="truncate">{f.filename} <span className="text-nfc-subtle">({humanSize(f.sizeBytes)})</span></span><button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-nfc-red text-xs font-bold">Remove</button></li>)}</ul>}
        </div>
        <button type="submit" disabled={saving} className="w-full bg-nfc-red text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 text-sm">{saving ? "Submitting…" : "Submit Ticket"}</button>
      </form>
    </div>
  );
}
